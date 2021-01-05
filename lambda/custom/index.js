/* eslint-disable no-else-return */
// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Amazon Software License
// http://aws.amazon.com/asl/

/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */
import {
  isNewSession,
  getRequestType,
  getIntentName,
  getSlotValue,
  SkillBuilders,
} from "ask-sdk-core";
import {
  getLaunchMessage,
  getStartMessage,
  getGameOverMessage,
  getGameOverRepromptMessage,
  getRepromptMessage,
  getErrorMessage,
  getExitMessage,
} from "./messages";

const STATES = {
  STARTING: "STARTED",
  ENDED: "ENDED",
};
const FIZZ_NUMBER = 3;
const BUZZ_NUMBER = 5;
const FIZZBUZZ_SLOT = "FizzBuzz";
const NUMBER_SLOT = "Number";

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

function getExpectedNumberAsString(number) {
  return fizzBuzzHelper(number + 1);
}

const LaunchRequest = {
  canHandle(handlerInput) {
    // launch requests as well sas any new session, as games are not saved in progress, which makes
    // no one shots a reasonable idea except for help, and the welcome message provides some help.
    return (
      isNewSession(handlerInput.requestEnvelope) ||
      getRequestType(handlerInput.requestEnvelope) === "LaunchRequest" ||
      getRequestType(handlerInput.requestEnvelope) === "GameIntent" ||
      getRequestType(handlerInput.requestEnvelope) === "AMAZON.StartOverIntent"
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const attributes = attributesManager.getSessionAttributes();
    attributes.gameState = STATES.STARTING;
    attributes.currentNumber = 1;

    attributesManager.setSessionAttributes(attributes);

    return handlerInput.responseBuilder
      .speak(getLaunchMessage + getStartMessage)
      .reprompt(getStartMessage)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return (
      getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent" ||
        getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak(getExitMessage).getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    return (
      getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(getLaunchMessage)
      .reprompt(getRepromptMessage(sessionAttributes.currentNumber))
      .getResponse();
  },
};

// const UnhandledIntent = {
//   canHandle() {
//     return true;
//   },
//   handle(handlerInput) {
//     const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("CONTINUE_MESSAGE"))
//       .reprompt(requestAttributes.t("CONTINUE_MESSAGE"))
//       .getResponse();
//   },
// };

const FizzBuzzIntent = {
  canHandle(handlerInput) {
    // handle numbers only during a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (
      sessionAttributes.gameState &&
      sessionAttributes.gameState === "STARTED"
    ) {
      isCurrentlyPlaying = true;
    }

    return (
      isCurrentlyPlaying &&
      getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      getIntentName(handlerInput.requestEnvelope) === "FizzBuzzIntent"
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    const answer =
      getSlotValue(handlerInput.requestEnvelope, FIZZBUZZ_SLOT) === null
        ? getSlotValue(handlerInput.requestEnvelope, NUMBER_SLOT)
        : getSlotValue(handlerInput.requestEnvelope, FIZZBUZZ_SLOT);
    const expected = getExpectedNumberAsString(sessionAttributes.currentNumber);

    if (!answer) {
      return handlerInput.responseBuilder
        .speak(getErrorMessage(sessionAttributes.currentNumber))
        .reprompt(getRepromptMessage(sessionAttributes.currentNumber))
        .getResponse();
    }

    if (expected === answer) {
      // Correct Answer
      sessionAttributes.gameState = STATES.STARTING;

      // handle increment because of Alexa saying the next number
      sessionAttributes.currentNumber += 2;
      attributesManager.setSessionAttributes(sessionAttributes);

      const newNumberAsString = fizzBuzzHelper(sessionAttributes.currentNumber);

      return handlerInput.responseBuilder
        .speak(newNumberAsString)
        .reprompt(getRepromptMessage(newNumberAsString))
        .getResponse();
    } else {
      // Incorrect Answer - game over
      sessionAttributes.gameState = STATES.ENDED;
      attributesManager.setSessionAttributes(sessionAttributes);
      return handlerInput.responseBuilder
        .speak(getGameOverMessage(expected))
        .reprompt(getGameOverRepromptMessage)
        .getResponse();
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

    return handlerInput.responseBuilder
      .speak(getErrorMessage(sessionAttributes.currentNumber))
      .reprompt(getErrorMessage(sessionAttributes.currentNumber))
      .getResponse();
  },
};

// const FallbackHandler = {
//   canHandle(handlerInput) {
//     // handle fallback intent, yes and no when playing a game
//     // for yes and no, will only get here if and not caught by the normal intent handler
//     return (
//       getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
//       (getIntentName(handlerInput.requestEnvelope) ===
//         "AMAZON.FallbackIntent" ||
//         getIntentName(handlerInput.requestEnvelope) === "AMAZON.YesIntent" ||
//         getIntentName(handlerInput.requestEnvelope) === "AMAZON.NoIntent")
//     );
//   },
//   handle(handlerInput) {
//     const { attributesManager } = handlerInput;
//     const requestAttributes = attributesManager.getRequestAttributes();
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     if (
//       sessionAttributes.gameState &&
//       sessionAttributes.gameState === "STARTED"
//     ) {
//       // currently playing
//       return handlerInput.responseBuilder
//         .speak(requestAttributes.t("FALLBACK_MESSAGE_DURING_GAME"))
//         .reprompt(requestAttributes.t("FALLBACK_REPROMPT_DURING_GAME"))
//         .getResponse();
//     }

//     // not playing
//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("FALLBACK_MESSAGE_OUTSIDE_GAME"))
//       .reprompt(requestAttributes.t("CONTINUE_MESSAGE"))
//       .getResponse();
//   },
// };

const skillBuilder = SkillBuilders.custom();

// eslint-disable-next-line import/prefer-default-export
export const handler = skillBuilder
  .addRequestHandlers(
    LaunchRequest,
    ExitHandler,
    HelpIntent,
    FizzBuzzIntent
    // FallbackHandler,
    // UnhandledIntent
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
