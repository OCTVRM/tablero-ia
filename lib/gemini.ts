import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    // We don't throw here to allow the app to boot even without the key, 
    // but we'll check it before using it in actions.
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not defined");
}

export const genAI = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    : null;

export const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-flash-latest" }) : null;
