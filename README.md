# Hankkibot
Chat bot specialized in Korean food recipes based on OpenAI API 
# Technology Stacks 
- Programming Language: Python, JavaScript/TypeScript 
- Framework/Libraries: LangChain, OpenAI, React, Node.js, Express, Flask 
- Desing/Styling: Tailwind CSS, Material-UI 
- Databases: ChromaDB, SQLite3 

## High-Level Architecture 
The application is using Retrieval-Augmented Generation (RAG) model. This approach combines the power of a large language model (LLM) like GPT with a dedicated knowledge base of Korean food recipes.

Here's a visual representation of the architecture:
<img width="2036" height="824" alt="Untitled-2025-08-16-1820" src="https://github.com/user-attachments/assets/d71c26ee-397f-4931-818b-8284b4979423" />

## Key Components:
- Frontend (Client): This is the user interface where users interact with the chatbot. It can be a web application, a mobile app, or integrated into a messaging platform. It's responsible for sending user messages to the backend and displaying the chatbot's responses.

- Backend (Server): This is the core of your application. It handles the business logic:
  - Receives requests from the frontend.
  - Manages conversation history.
  - Queries the vector database to find relevant recipes.
  - Constructs a prompt for the OpenAI API, including the user's question and the retrieved recipe information.
  - Sends the prompt to the OpenAI API.
  - Receives the response from OpenAI and sends it back to the frontend.

- OpenAI API: This provides the Natural Language Understanding (NLU) and Natural Language Generation (NLG) capabilities. You'll use a model like GPT-4 or GPT-3.5-turbo to understand user queries and generate human-like responses.

- Vector Database (Knowledge Base): This is where your specialized knowledge about Korean food recipes is stored.
  - You'll take your recipe data (from text files, PDFs, or a database) and convert it into numerical representations called "embeddings."
  - These embeddings are stored in a vector database (e.g., Pinecone, Weaviate, or Chroma).
  - When a user asks a question, the backend creates an embedding of the question and uses it to search the vector database for the most similar (i.e., most relevant) recipes.
- Recipe Data: This is your raw data source for Korean food recipes. It can be a collection of text files, documents, or a structured database.
- Food blogs: https://chef-choice.tistory.com/#google_vignette
- Cookbook PDF Version:




