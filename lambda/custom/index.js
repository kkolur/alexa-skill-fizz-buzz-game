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
import { getLaunchMessage, getNewGameMessage, getGameOverMessage, getRepromptMessage, getErrorMessage, getExitMessage } from "./messages";

const LaunchRequest = {
  canHandle(handlerInput) {
    // launch requests as well as any new session, as games are not saved in progress, which makes
    // no one shots a reasonable idea except for help, and the welcome message provides some help.
    return (
      isNewSession(handlerInput.requestEnvelope) ||
      getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const attributes =
      (await attributesManager.getPersistentAttributes()) || {};

    if (Object.keys(attributes).length === 0) {
      attributes.endedSessionCount = 0;
      attributes.gameState = "ENDED";
    }

    attributesManager.setSessionAttributes(attributes);

    const speechOutput = getLaunchMessage;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

// const ExitHandler = {
//   canHandle(handlerInput) {
//     return (
//       getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
//       (getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent" ||
//         getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent")
//     );
//   },
//   handle(handlerInput) {
//     const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("EXIT_MESSAGE"))
//       .getResponse();
//   },
// };

// const SessionEndedRequest = {
//   canHandle(handlerInput) {
//     return (
//       getRequestType(handlerInput.requestEnvelope) === "SessionEndedRequest"
//     );
//   },
//   handle(handlerInput) {
//     console.log(
//       `Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
//     );
//     return handlerInput.responseBuilder.getResponse();
//   },
// };

// const HelpIntent = {
//   canHandle(handlerInput) {
//     return (
//       getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
//       getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
//     );
//   },
//   handle(handlerInput) {
//     const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("HELP_MESSAGE"))
//       .reprompt(requestAttributes.t("HELP_REPROMPT"))
//       .getResponse();
//   },
// };

// const YesIntent = {
//   canHandle(handlerInput) {
//     // only start a new game if yes is said when not playing a game.
//     let isCurrentlyPlaying = false;
//     const { attributesManager } = handlerInput;
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     if (
//       sessionAttributes.gameState &&
//       sessionAttributes.gameState === "STARTED"
//     ) {
//       isCurrentlyPlaying = true;
//     }

//     return (
//       !isCurrentlyPlaying &&
//       getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
//       getIntentName(handlerInput.requestEnvelope) === "AMAZON.YesIntent"
//     );
//   },
//   handle(handlerInput) {
//     const { attributesManager } = handlerInput;
//     const requestAttributes = attributesManager.getRequestAttributes();
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     sessionAttributes.gameState = "STARTED";
//     sessionAttributes.guessNumber = Math.floor(Math.random() * 101);

//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("YES_MESSAGE"))
//       .reprompt(requestAttributes.t("HELP_REPROMPT"))
//       .getResponse();
//   },
// };

// const NoIntent = {
//   canHandle(handlerInput) {
//     // only treat no as an exit when outside a game
//     let isCurrentlyPlaying = false;
//     const { attributesManager } = handlerInput;
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     if (
//       sessionAttributes.gameState &&
//       sessionAttributes.gameState === "STARTED"
//     ) {
//       isCurrentlyPlaying = true;
//     }

//     return (
//       !isCurrentlyPlaying &&
//       getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
//       getIntentName(handlerInput.requestEnvelope) === "AMAZON.NoIntent"
//     );
//   },
//   async handle(handlerInput) {
//     const { attributesManager } = handlerInput;
//     const requestAttributes = attributesManager.getRequestAttributes();
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     sessionAttributes.endedSessionCount += 1;
//     sessionAttributes.gameState = "ENDED";
//     attributesManager.setPersistentAttributes(sessionAttributes);

//     await attributesManager.savePersistentAttributes();

//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("EXIT_MESSAGE"))
//       .getResponse();
//   },
// };

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

// const NumberGuessIntent = {
//   canHandle(handlerInput) {
//     // handle numbers only during a game
//     let isCurrentlyPlaying = false;
//     const { attributesManager } = handlerInput;
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     if (
//       sessionAttributes.gameState &&
//       sessionAttributes.gameState === "STARTED"
//     ) {
//       isCurrentlyPlaying = true;
//     }

//     return (
//       isCurrentlyPlaying &&
//       getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
//       getIntentName(handlerInput.requestEnvelope) === "NumberGuessIntent"
//     );
//   },
//   async handle(handlerInput) {
//     const { attributesManager } = handlerInput;
//     const requestAttributes = attributesManager.getRequestAttributes();
//     const sessionAttributes = attributesManager.getSessionAttributes();

//     const guessNum = parseInt(
//       getSlotValue(handlerInput.requestEnvelope, "number"),
//       10
//     );
//     const targetNum = sessionAttributes.guessNumber;

//     if (guessNum > targetNum) {
//       return handlerInput.responseBuilder
//         .speak(requestAttributes.t("TOO_HIGH_MESSAGE", guessNum.toString()))
//         .reprompt(requestAttributes.t("TOO_HIGH_REPROMPT"))
//         .getResponse();
//     } else if (guessNum < targetNum) {
//       return handlerInput.responseBuilder
//         .speak(requestAttributes.t("TOO_LOW_MESSAGE", guessNum.toString()))
//         .reprompt(requestAttributes.t("TOO_LOW_REPROMPT"))
//         .getResponse();
//     } else if (guessNum === targetNum) {
//       sessionAttributes.gamesPlayed += 1;
//       sessionAttributes.gameState = "ENDED";
//       attributesManager.setPersistentAttributes(sessionAttributes);
//       await attributesManager.savePersistentAttributes();
//       return handlerInput.responseBuilder
//         .speak(
//           requestAttributes.t("GUESS_CORRECT_MESSAGE", guessNum.toString())
//         )
//         .reprompt(requestAttributes.t("CONTINUE_MESSAGE"))
//         .getResponse();
//     }
//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("FALLBACK_MESSAGE_DURING_GAME"))
//       .reprompt(requestAttributes.t("FALLBACK_REPROMPT_DURING_GAME"))
//       .getResponse();
//   },
// };

// const ErrorHandler = {
//   canHandle() {
//     return true;
//   },
//   handle(handlerInput, error) {
//     console.log(`Error handled: ${error.message}`);
//     console.log(`Error stack: ${error.stack}`);
//     const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

//     return handlerInput.responseBuilder
//       .speak(requestAttributes.t("ERROR_MESSAGE"))
//       .reprompt(requestAttributes.t("ERROR_MESSAGE"))
//       .getResponse();
//   },
// };

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
    SessionEndedRequest,
    HelpIntent,
    YesIntent,
    NoIntent,
    NumberGuessIntent,
    FallbackHandler,
    UnhandledIntent
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
