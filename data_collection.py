import requests
import json
from bs4 import BeautifulSoup

def scrape_recipe(url):
    try: 
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Look for the JSON-LD script tag
        script = soup.find('script', type='application/ld+json')
        if script:
            data = json.loads(script.string)
            # Find the recipe object in the JSON-LD
            for item in data['@graph']:
                if item['@type'] == 'Recipe':
                    return {
                        'name': item.get('name'),
                        'ingredients': item.get('recipeIngredient'),
                        'instructions': [step['text'] for step in item.get('recipeInstructions', [])],
                        'url': url
                    }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
    return None

# Example usage:
recipe_url = 'https://chef-choice.tistory.com/760'
recipe_data = scrape_recipe(recipe_url)
if recipe_data:
    print(json.dumps(recipe_data, indent=2))

