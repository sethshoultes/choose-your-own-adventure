import type { StoryPrompt } from './types';

export function generateSystemPrompt(genre: string): string {
  const basePrompt = `You are a creative and engaging storyteller specializing in ${genre} narratives. 
Your task is to continue the story based on the player's choices, maintaining consistency with the genre, 
character attributes, and previous events. Each response should include a vivid scene description and 3 meaningful choices.

Guidelines:
- Keep descriptions vivid but concise (150-200 words)
- Maintain consistent tone and style
- Reference character attributes and equipment when relevant
- Create meaningful choices that impact the story
- Ensure choices are distinct and interesting
- Avoid repetitive scenarios
- Keep track of story continuity`;

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

  let prompt = `Character: ${character.name}
Attributes: ${character.attributes.map(a => `${a.name}: ${a.value}`).join(', ')}
Equipment: ${character.equipment.map(e => e.name).join(', ')}

Current Scene:
${currentScene}

Player Choice:
${choice}

Continue the story and provide 3 new choices. Format your response as JSON:
{
  "description": "Scene description here...",
  "choices": [
    {"id": 1, "text": "First choice"},
    {"id": 2, "text": "Second choice"},
    {"id": 3, "text": "Third choice"}
  ]
}`;

  if (history.length > 0) {
    prompt = `${prompt}\n\nPrevious choices:\n${history
      .map(h => `- ${h.choice}`)
      .join('\n')}`;
  }

  return prompt;
}