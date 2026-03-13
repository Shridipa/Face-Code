import os
import time
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from openai import OpenAI

# Load API keys from a local .env file
load_dotenv()

class LLMHintGenerator:
    def __init__(self):
        """Initializes the Groq API client using the OpenAI-compatible SDK."""
        self.api_key = os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            print("Warning: GROQ_API_KEY not found in environment!")
            self.client = None
        else:
            try:
                self.client = OpenAI(
                    base_url="https://api.groq.com/openai/v1",
                    api_key=self.api_key
                )
                self.model = "llama-3.3-70b-versatile"
            except Exception as e:
                self.client = None
                print(f"Failed to initialize Groq client: {e}")

    def clean_html(self, html_content: str) -> str:
        """Strips HTML tags and removes excessive LeetCode boilerplate for cleaner prompts."""
        if not html_content:
            return "No description provided."
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            # Remove scripts, styles, and SVG blocks that clutter descriptions
            for s in soup(["script", "style", "svg"]):
                s.decompose()
            
            text = soup.get_text(separator=' ')
            # Collapse multiple spaces
            import re
            text = re.sub(r'\s+', ' ', text).strip()
            return text[:2000] 
        except Exception:
            return str(html_content)[:1000]

    def generate_partial_solution(self, problem_title: str, problem_description: str, user_code: str):
        """
        Requests the Groq (Llama 3.3) model to provide a highly contextual hint.
        """
        if not self.client:
            return "AI Mentor is currently in local mode. Please configure GROQ_API_KEY."

        cleaned_description = self.clean_html(problem_description)
        
        system_prompt = (
            "You are a Senior Python Mentor for a coding platform. Your goal is to provide specific, brief coding hints (1-2 sentences).\n"
            "STRICT RULES:\n"
            "1. NO GENERIC INTROS (e.g., 'To solve this efficiently...', 'To find the numbers...', 'To get started...').\n"
            "2. START DIRECTLY with the relevant advice.\n"
            "3. ALWAYS FINISH YOUR THOUGHT. Your output must be 100% complete sentences.\n"
            "4. Use Socratic questioning to guide the user without giving the full code.\n"
            "5. If they have written code, analyze it specifically for bugs or next logical steps."
        )

        user_prompt = f"""
        PROBLEM: {problem_title}
        DESCRIPTION: {cleaned_description}
        STUDENT CODE ATTEMPT:
        ```python
        {user_code if user_code.strip() else "# No code written yet."}
        ```

        GIVE A HINT:
        (Remember: 1-2 complete sentences, start directly with specific advice.)
        """

        try:
            print(f"[LLMHintGenerator] Requesting Groq Llama-3 hint for: {problem_title}")
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=300,
                top_p=1,
                stream=False
            )
            
            hint = completion.choices[0].message.content.strip()
            
            # Final safety check to ensure sentences are complete
            if not hint.endswith(('.', '?', '!')):
                hint += "."
                
            return hint
            
        except Exception as e:
            print(f"[LLMHintGenerator] Groq API ERROR: {e}")
            return "The AI Mentor is currently recalibrating its algorithms. Try again in a moment!"

if __name__ == "__main__":
    # Internal test check
    print("--- Training check for Groq Hint Logic ---")
    gen = LLMHintGenerator()
    test_hint = gen.generate_partial_solution(
        "Two Sum", 
        "Find two numbers that sum up to a target.", 
        "def twoSum(nums, target): pass"
    )
    print(f"\n[AI MENTOR]: {test_hint}")
