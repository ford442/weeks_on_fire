#!/usr/bin/env python3
"""
Generate Grok Imagine prompts from a synopsis or scene description.
Usage: python generate-prompts.py "your synopsis here"
"""
import sys

def generate_prompts(text):
    prompts = [
        f"Cinematic wide shot, {text}, dramatic lighting, filmic color grade, high detail, Grok Imagine style",
        f"Close-up emotional moment, {text}, intense atmosphere, detailed textures, cinematic",
        f"Dynamic action sequence, {text}, motion blur, epic composition, vibrant yet moody tones"
    ]
    return prompts

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
        for i, p in enumerate(generate_prompts(text), 1):
            print(f"Prompt {i}:\n{p}\n")
    else:
        print("Usage: python generate-prompts.py 'scene description or synopsis'")