import type { Genre, Scene, Choice } from '../types';

export function getInitialScene(genre: Genre): string {
  switch (genre) {
    case 'Fantasy':
      return `In the ancient kingdom of Eldara, you find yourself standing before the towering gates of the Crystal Palace. The air shimpers with magical energy, and whispers of an impending doom echo through the streets.

The Royal Guard captain approaches you with urgency in his eyes. "Thank the gods you've arrived," he says. "We need your help. The Sacred Crystal has been stolen, and without it, our realm will fall into chaos."

Dark clouds gather overhead as you consider your next move.`;
    case 'Sci-Fi':
      return `Warning lights flash across the command console of your damaged starship. The emergency AI's voice crackles through the speakers: "Hull breach detected. Multiple systems failing. Emergency protocols initiated."

Through the viewport, you see the swirling anomaly that disabled your ship growing larger. The research station you were sent to investigate floats silently in the distance, its lights blinking in an odd pattern.

Time is running out, and you must make a decision.`;
    case 'Horror':
      return `The old mansion looms before you, its decrepit walls seeming to absorb what little moonlight filters through the clouds. The missing persons case that led you here suddenly feels much more sinister.

A crash echoes from inside, followed by an unnatural silence. Your flashlight flickers, and for a moment, you swear you see movement in one of the upper windows.

The wind carries what sounds like distant whispers.`;
    case 'Mystery':
      return `The detective's office is dimly lit, case files scattered across the desk. The photograph in your hand shows the victim, a prominent city councilor, found dead in mysterious circumstances.

Your phone buzzes - an anonymous tip about a warehouse at the edge of town. At the same time, the victim's daughter is waiting in the lobby, claiming to have vital information.

The clock strikes midnight.`;
    default:
      return 'Invalid genre selected.';
  }
}

export function getInitialChoices(genre: Genre): Choice[] {
  switch (genre) {
    case 'Fantasy':
      return [
        { id: 1, text: 'Offer to help track down the crystal thief immediately' },
        { id: 2, text: 'Question the captain about recent suspicious activities in the palace' },
        { id: 3, text: 'Investigate the crystal\'s chamber for clues first' },
      ];
    case 'Sci-Fi':
      return [
        { id: 1, text: 'Attempt emergency repairs on the hull breach' },
        { id: 2, text: 'Try to dock with the research station' },
        { id: 3, text: 'Launch an emergency probe to study the anomaly' },
      ];
    case 'Horror':
      return [
        { id: 1, text: 'Enter through the front door with caution' },
        { id: 2, text: 'Circle the mansion to find another way in' },
        { id: 3, text: 'Call for backup before proceeding' },
      ];
    case 'Mystery':
      return [
        { id: 1, text: 'Head to the warehouse immediately' },
        { id: 2, text: 'Interview the victim\'s daughter' },
        { id: 3, text: 'Review the case files more thoroughly' },
      ];
    default:
      return [];
  }
}