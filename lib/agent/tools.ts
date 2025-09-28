import { llm } from '@livekit/agents';
import { z } from 'zod';

// Weather tool schema
export const weatherToolSchema = z.object({
  location: z
    .string()
    .describe('The location to look up weather information for (e.g. city name)'),
});

// Weather tool implementation
export const getWeatherTool = llm.tool({
  description: `Use this tool to look up current weather information in the given location.

  If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.`,
  parameters: weatherToolSchema,
  execute: async ({ location }) => {
    console.log(`Looking up weather for ${location}`);
    
    // Mock weather data - replace with actual weather API call
    const mockWeatherData = {
      'new york': 'sunny with a temperature of 70 degrees',
      'london': 'cloudy with a temperature of 60 degrees',
      'tokyo': 'rainy with a temperature of 75 degrees',
      'paris': 'partly cloudy with a temperature of 65 degrees',
    };
    
    const normalizedLocation = location.toLowerCase();
    const weather = mockWeatherData[normalizedLocation as keyof typeof mockWeatherData];
    
    if (weather) {
      return `The weather in ${location} is ${weather}.`;
    }
    
    return `Weather information for ${location} is currently unavailable.`;
  },
});

// Time tool schema
export const timeToolSchema = z.object({
  timezone: z
    .string()
    .optional()
    .describe('The timezone to get time for (e.g. "America/New_York", "Europe/London")'),
});

// Time tool implementation
export const getTimeTool = llm.tool({
  description: 'Get the current time in a specific timezone or local time.',
  parameters: timeToolSchema,
  execute: async ({ timezone }) => {
    console.log(`Getting time for timezone: ${timezone || 'local'}`);
    
    const now = new Date();
    let timeString: string;
    
    if (timezone) {
      try {
        timeString = now.toLocaleString('en-US', { timeZone: timezone });
      } catch (error) {
        return `Invalid timezone: ${timezone}`;
      }
    } else {
      timeString = now.toLocaleString();
    }
    
    return `The current time is ${timeString}`;
  },
});

// Calculator tool schema
export const calculatorToolSchema = z.object({
  expression: z
    .string()
    .describe('Mathematical expression to evaluate (e.g. "2 + 2", "10 * 5")'),
});

// Calculator tool implementation
export const calculatorTool = llm.tool({
  description: 'Perform basic mathematical calculations safely.',
  parameters: calculatorToolSchema,
  execute: async ({ expression }) => {
    console.log(`Calculating: ${expression}`);
    
    try {
      // Simple safe evaluation - only allow basic math operations
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = Function(`"use strict"; return (${sanitized})`)();
      
      if (typeof result === 'number' && !isNaN(result)) {
        return `The result of ${expression} is ${result}`;
      } else {
        return `Invalid mathematical expression: ${expression}`;
      }
    } catch (error) {
      return `Error calculating ${expression}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// Export all tools
export const agentTools = {
  getWeather: getWeatherTool,
  getTime: getTimeTool,
  calculator: calculatorTool,
};
