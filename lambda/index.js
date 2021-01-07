/* eslint-disable no-else-return */

/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */
const Alexa = require("ask-sdk-core");
const Messages = require("./messages");

// possible game states
const STATES = {
  STARTING: "STARTED",
  ENDED: "ENDED",
};

// Slots for recognizing the type of speech input
const FIZZBUZZ_SLOT = "FizzBuzz";
const NUMBER_SLOT = "Number";

// Fizz and Buzz number equivalents
const FIZZ_NUMBER = 3;
const BUZZ_NUMBER = 5;

/**
 * Checks the number - if it is divisible by 3, it will return 'fizz'. If it
 * is divisible by 5 it will return 'buzz'. If it is divisible by 3 and 5,
 * it will return 'fizzbuzz'. Otherwise it will return the original number.
 *
 * @param {number} number The number to validate.
 * @return {string} fizz, buzz, or the number in string format depending on validation.
 */
function fizzBuzzHelper(number) {
  if (number % FIZZ_NUMBER === 0 && number % BUZZ_NUMBER === 0) {
    return "fizzbuzz";
  } else if (number % FIZZ_NUMBER === 0) {
    return "fizz";
  } else if (number % BUZZ_NUMBER === 0) {
    return "buzz";
  } else {
    return number.toString();
  }
}
/**
 * Gets the expected, or next, response as a string
 *
 * @param {number} number The number to validate.
 * @return {string} fizz, buzz, or the number in string format depending on validation.
 */
function getExpectedNumberAsString(number) {
  return fizzBuzzHelper(number + 1);
}

/**
 * Helper function that returns Alexa's speech response
 *
 * @param {any} handlerInput The number to validate.
 * @param {string} speakOutput The speech output message
 * @param {string} reprompt The reprompt message
 * @return {string} Alexa's speech response
 */
function getSpeechResponse(handlerInput, speakOutput, reprompt) {
  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(reprompt)
    .getResponse();
}

const LaunchRequest = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest" ||
      (Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
        Alexa.getIntentName(handlerInput.requestEnvelope) === "GameIntent")
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const attributes = attributesManager.getSessionAttributes();
    const reprompt = Messages.getStartMessage;
    const speakOutput = Messages.getLaunchMessage + reprompt;

    // Initialize the attributes when starting/launching a new game
    attributes.gameState = STATES.STARTING;
    attributes.currentNumber = 1;
    attributes.response = "1";
    attributes.lastResponse = attributes.response;

    attributesManager.setSessionAttributes(attributes);

    return getSpeechResponse(handlerInput, speakOutput, reprompt);
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(Messages.getExitMessage)
      .getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const reprompt = Messages.getRepromptMessage(sessionAttributes.response);
    const speakOutput = Messages.getLaunchMessage + reprompt;

    return getSpeechResponse(handlerInput, speakOutput, reprompt);
  },
};

const FizzBuzzIntent = {
  canHandle(handlerInput) {
    // handle numbers, fizz,buzz, and fizzbuzz only during a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    // Determine if game is in session
    if (
      sessionAttributes.gameState &&
      sessionAttributes.gameState === "STARTED"
    ) {
      isCurrentlyPlaying = true;
    }

    return (
      isCurrentlyPlaying &&
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "FizzBuzzIntent"
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    // Determine if the speech is a number or fizzbuzz word
    const answer = !Alexa.getSlotValue(
      handlerInput.requestEnvelope,
      FIZZBUZZ_SLOT
    )
      ? Alexa.getSlotValue(handlerInput.requestEnvelope, NUMBER_SLOT)
      : Alexa.getSlotValue(handlerInput.requestEnvelope, FIZZBUZZ_SLOT);

    // Calculate the expected answer
    const expected = getExpectedNumberAsString(sessionAttributes.currentNumber);

    console.log("CHECK ANSWER: ", answer);

    if (!answer) {
      const speakOutput = Messages.getErrorMessage(sessionAttributes.response);
      const reprompt = Messages.getRepromptMessage(sessionAttributes.response);

      return getSpeechResponse(handlerInput, speakOutput, reprompt);
    }

    if (expected === answer) {
      // Correct Answer
      sessionAttributes.gameState = STATES.STARTING;

      // handle increment because of Alexa saying the next number
      sessionAttributes.currentNumber += 2;
      
      // convert the newly calculated number in string format for Alexa to say
      const newNumberAsString = fizzBuzzHelper(sessionAttributes.currentNumber);
      const reprompt = Messages.getRepromptMessage(newNumberAsString);

      sessionAttributes.response = newNumberAsString;
      attributesManager.setSessionAttributes(sessionAttributes);

      return getSpeechResponse(handlerInput, newNumberAsString, reprompt);
    } else {
      // Incorrect Answer - game over
      const speakOutput = Messages.getGameOverMessage(expected);
      const reprompt = Messages.getGameOverRepromptMessage;

      sessionAttributes.gameState = STATES.ENDED;
      attributesManager.setSessionAttributes(sessionAttributes);

      return getSpeechResponse(handlerInput, speakOutput, reprompt);
    }
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);

    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const speakOutput = Messages.getErrorMessage(sessionAttributes.response);
    const reprompt = Messages.getErrorMessage(sessionAttributes.response);

    return getSpeechResponse(handlerInput, speakOutput, reprompt);
  },
};

// handler in charge of repeating the most recent phrase spoken
const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.RepeatIntent"
    );
  },
  handle(handlerInput) {
    // Get the session attributes.
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const { lastResponse } = sessionAttributes;
    const speakOutput = lastResponse;

    return getSpeechResponse(handlerInput, speakOutput, speakOutput);
  },
};

const saveResponseForRepeatingInterceptor = {
  process(handlerInput) {
    console.log("Saving for repeating later…");
    const response = handlerInput.responseBuilder.getResponse().outputSpeech
      .ssml;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.lastResponse = response;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const speakOutput = Messages.getErrorMessage(sessionAttributes.response);

    return getSpeechResponse(handlerInput, speakOutput, speakOutput);
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

// eslint-disable-next-line import/prefer-default-export
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    ExitHandler,
    HelpIntent,
    FizzBuzzIntent,
    RepeatIntentHandler,
    FallbackHandler
  )
  .addResponseInterceptors(saveResponseForRepeatingInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
