import type { StoryPrompt } from './types';

export function generateSystemPrompt(genre: string): string {
  const basePrompt = `You are a creative and engaging storyteller specializing in ${genre} narratives. 
Your task is to continue the story based on the player's choices. Your response MUST be valid JSON in this exact format:

{
  "description": "Scene description here...",
  "choices": [
    { "id": 1, "text": "First choice" },
    { "id": 2, "text": "Second choice" },
    { "id": 3, "text": "Third choice" }
  ]
}

Guidelines:
1. Description:
   - Keep descriptions vivid but concise (150-200 words)
   - Maintain consistent tone and style
   - Reference character attributes and equipment when relevant
   - Avoid repetitive scenarios
   - Keep track of story continuity

2. Choices:
   - ALWAYS provide exactly 3 choices
   - Each choice must have an id (1, 2, or 3) and text
   - Make choices meaningful and distinct
   - Consider character attributes
   - Lead to different narrative paths

3. Response Format:
   - MUST be valid JSON
   - MUST include both description and choices
   - NO additional fields or formatting
   - NO markdown or special characters`;

  switch (genre) {
    case 'Fantasy':
      return `${basePrompt}

Fantasy-specific guidelines:
- Include magical elements and fantastical creatures
- Reference the medieval/magical setting
- Consider magical abilities in choices
- Balance combat, diplomacy, and mystical solutions`;

    case 'Sci-Fi':
      return `${basePrompt}

Sci-Fi-specific guidelines:
- Include advanced technology and scientific concepts
- Reference space, future tech, or advanced civilizations
- Consider technological solutions in choices
- Balance action, problem-solving, and exploration`;

    case 'Horror':
      return `${basePrompt}

Horror-specific guidelines:
- Build tension and atmosphere
- Include psychological and supernatural elements
- Consider fight-or-flight responses in choices
- Balance investigation, survival, and confrontation`;

    case 'Mystery':
      return `${basePrompt}

Mystery-specific guidelines:
- Include clues and red herrings
- Reference investigation techniques
- Consider deductive reasoning in choices
- Balance interrogation, investigation, and action`;

    default:
      return basePrompt;
  }
}

export function generateUserPrompt({ context, choice }: StoryPrompt): string {
  const { character, currentScene, history } = context;

  let prompt = `IMPORTANT: Your response MUST be valid JSON matching the format specified in the system prompt.

Character Information:
Name: ${character.name}
Attributes:
${character.attributes.map(a => `  * ${a.name} (${a.value}): ${a.description}`).join('\n')}
Equipment:
${character.equipment.map(e => `  * ${e.name}: ${e.description}`).join('\n')}
${character.backstory ? `Backstory: ${character.backstory}` : ''}

Current Scene:
${currentScene}

Player Choice:
${choice}


Guidelines:
- Description should be 150-200 words
- Each choice must be distinct and meaningful
- Choices should consider character attributes
- Maintain consistent tone and genre
- Reference previous choices for continuity`;

  if (history.length > 0) {
    prompt = `${prompt}\n\nStory History:\n${history
      .map(h => `- Scene: ${h.sceneDescription}\n  Choice: ${h.choice}`)
      .join('\n\n')}`;
  }

  return prompt;
}