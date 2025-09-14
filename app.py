import os
from flask import Flask, request, jsonify, stream_with_context
from flask_cors import CORS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.vectorstores.chroma import Chroma
from langchain.prompts import PromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain_community.document_loaders.csv_loader import CSVLoader
import json

# --- CONFIGURATION ---
# Set your OpenAI API key as an environment variable:
# export OPENAI_API_KEY="your_api_key"
if "OPENAI_API_KEY" not in os.environ:
    # This is a fallback for development. 
    # In production, you should use environment variables.
    # Replace with your actual key if not using environment variables.
    # from dotenv import load_dotenv
    # load_dotenv()
    print("Warning: OPENAI_API_KEY not found in environment variables.")


# --- INITIALIZATION ---
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# --- GLOBAL VARIABLES ---
# We'll load the data and create the retriever only once when the app starts.
retriever = None

def initialize_retriever():
    """
    Initializes the document retriever from the CSV data.
    This function is called once when the application starts.
    """
    global retriever
    if retriever is not None:
        print("Retriever already initialized.")
        return

    print("Initializing retriever...")
    try:
        # 1. Load data from CSV
        loader = CSVLoader(file_path='./recipes.csv', encoding='utf-8')
        documents = loader.load()

        # 2. Create embeddings
        # Using OpenAI's text-embedding-3-small model for embeddings
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

        # 3. Create a Chroma vector store
        # This will store the embedded documents in memory for quick retrieval.
        vector_store = Chroma.from_documents(documents, embeddings)

        # 4. Create a retriever
        # This will be used to fetch relevant documents based on a user's query.
        retriever = vector_store.as_retriever(search_kwargs={'k': 3}) # Retrieve top 3 results
        print("Retriever initialized successfully.")

    except Exception as e:
        print(f"Error initializing retriever: {e}")
        # Handle error appropriately in a production environment
        retriever = None


# --- LANGCHAIN SETUP ---
def create_rag_chain():
    """
    Creates and returns the RAG (Retrieval-Augmented Generation) chain.
    """
    if not retriever:
        raise ValueError("Retriever has not been initialized. Please call initialize_retriever first.")

    # 1. Define the prompt template
    # This template structures the input to the language model,
    # ensuring it has the context and the question.
    template = """
    You are a friendly and helpful Korean cooking assistant.
    Your goal is to answer questions about Korean recipes based ONLY on the context provided.
    If the information is not in the context, politely state that you can't find the answer in the provided recipes.
    Do not make up information. Be concise and clear in your answer.

    CONTEXT:
    {context}

    QUESTION:
    {question}

    ANSWER:
    """
    prompt = PromptTemplate.from_template(template)

    # 2. Initialize the Language Model
    # We use stream=True to get responses token by token.
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3, streaming=True)

    # 3. Create the RAG chain
    # This chain will:
    # - Take a "question"
    # - Pass it to the retriever to get relevant "context"
    # - Pass the "question" and "context" to the prompt
    # - Pass the formatted prompt to the language model
    # - Parse the output as a string
    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain


# --- API ENDPOINT ---
@app.route('/chat', methods=['POST'])
def chat():
    """
    The main chat endpoint. It receives a user's question,
    processes it through the RAG chain, and streams the response back.
    """
    try:
        data = request.get_json()
        question = data.get("question")

        if not question:
            return jsonify({"error": "Question is required"}), 400
            
        if not retriever:
            return jsonify({"error": "Chatbot is not ready. Please try again later."}), 503

        # Create a new chain for each request to ensure thread safety
        rag_chain = create_rag_chain()

        def generate():
            """
            A generator function that yields response chunks.
            """
            try:
                for chunk in rag_chain.stream(question):
                    # Each chunk is a piece of the response string.
                    # We format it as a server-sent event (SSE).
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except Exception as e:
                print(f"Error during stream generation: {e}")
                yield f"data: {json.dumps({'error': 'An error occurred while generating the response.'})}\n\n"

        # stream_with_context keeps the request context available in the generator
        return app.response_class(stream_with_context(generate()), mimetype='text/event-stream')

    except Exception as e:
        print(f"An error occurred in /chat: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

# --- APP STARTUP ---
if __name__ == '__main__':
    # Initialize the retriever when the Flask app starts
    initialize_retriever()
    # Run the Flask app
    # In a production environment, you would use a WSGI server like Gunicorn
    app.run(host='0.0.0.0', port=5001, debug=True)
