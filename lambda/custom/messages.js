export const getStartMessage = `OK. I'll start... One. `;
export const getGameOverMessage = (answer) =>
  `I’m sorry, the correct response was "${answer}". You lose! Thanks for playing Fizz Buzz. For another great Alexa game, check out Song Quiz!`;
export const getGameOverRepromptMessage = `Please say 'new game' to start a new game, or 'stop' to exit.`;
export const getRepromptMessage = (number) =>
  `It's your turn. Pick a number, and remember we're playing fizz buzz. My last number was "${number}". Please try again, or say 'help' for more information.`;
export const getExitMessage = `Thank you for playing fizz buzz!  Let's play again soon!`;
export const getLaunchMessage = `Welcome to Fizz Buzz. We’ll each take turns counting up from one. However, you must replace numbers divisible by 3 with the word “fizz” and you must replace numbers divisible by 5 with the word “buzz”. If a number is divisible by both 3 and 5, you should instead say “fizz buzz”. If you get one wrong, you lose.`;
export const getErrorMessage = (number) =>
  `I'm sorry - I didn't recognise your answer. My last number was "${number}". Please try again, or say 'help' for more information.`;
