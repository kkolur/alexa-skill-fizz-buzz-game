/* eslint-disable no-else-return */

/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */
const Alexa = require('ask-sdk-core');
const Messages = require('./messages');

const STATES = {
    STARTING: "STARTED",
    ENDED: "ENDED",
};
const FIZZBUZZ_SLOT = "FizzBuzz";
const NUMBER_SLOT = "Number";
const FIZZ_NUMBER = 3;
const BUZZ_NUMBER = 5;

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

function getSpeechResponse(handlerInput, speakOutput, reprompt) {
    return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();
}

const LaunchRequest = {
    canHandle(handlerInput) {
        // launch requests as well as any new session, as games are not saved in progress, which makes
        // no one shots a reasonable idea except for help, and the welcome message provides some help.
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
            || (Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
                && Alexa.getIntentName(handlerInput.requestEnvelope) === "GameIntent");
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const attributes = attributesManager.getSessionAttributes();
        const speakOutput = Messages.getLaunchMessage + Messages.getStartMessage;
    
        attributes.gameState = STATES.STARTING;
        attributes.currentNumber = 1;
        attributes.response = "1";
        attributes.lastResponse = attributes.response;
    
        attributesManager.setSessionAttributes(attributes);
        
        return getSpeechResponse(handlerInput, speakOutput, Messages.getStartMessage)
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent"
                || Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent");
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.speak(Messages.getExitMessage).getResponse();
    },
};

const HelpIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent";
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
    
        return getSpeechResponse(handlerInput, Messages.getLaunchMessage, Messages.getRepromptMessage(sessionAttributes.response));
    },
};

const FizzBuzzIntent = {
    canHandle(handlerInput) {
        // handle numbers only during a game
        let isCurrentlyPlaying = false;
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
    
        if (sessionAttributes.gameState 
            && sessionAttributes.gameState === "STARTED") {
          isCurrentlyPlaying = true;
        }
    
        return isCurrentlyPlaying
            && Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "FizzBuzzIntent";
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
    
        const answer = 
            !Alexa.getSlotValue(handlerInput.requestEnvelope, FIZZBUZZ_SLOT)
                ? Alexa.getSlotValue(handlerInput.requestEnvelope, NUMBER_SLOT)
                : Alexa.getSlotValue(handlerInput.requestEnvelope, FIZZBUZZ_SLOT);
        const expected = getExpectedNumberAsString(sessionAttributes.currentNumber);
        
        console.log("CHECK ANSWER: ",answer);
    
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

const RepeatIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.RepeatIntent";
    },
    handle(handlerInput) {
        // Get the session attributes.
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); 
        const { lastResponse } = sessionAttributes;
        const speakOutput = lastResponse;
        
        return getSpeechResponse(handlerInput, speakOutput, speakOutput);
    }
};

const saveResponseForRepeatingInterceptor = {
    process(handlerInput) {
        console.log('Saving for repeating later…');
        const response = handlerInput.responseBuilder.getResponse().outputSpeech.ssml;
        const sessionAttributes =  handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.lastResponse = response;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    },
};

const FallbackHandler = {
    canHandle(handlerInput) {
        // handle fallback intent, yes and no when playing a game
        // for yes and no, will only get here if and not caught by the normal intent handler
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
            && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.FallbackIntent";
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
    .addResponseInterceptors(
        saveResponseForRepeatingInterceptor
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
