import { GoogleGenAI, Type } from "@google/genai";
import { CostCategory, EstimateItem } from "../types";

// Utility to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Recursive function to process AI response into our internal format
const processAIItems = (items: any[], parentWbs: string = ''): EstimateItem[] => {
  return items.map((item, index) => {
    const currentWbs = parentWbs ? `${parentWbs}.${index + 1}` : `${index + 1}`;
    const subItems = item.subItems ? processAIItems(item.subItems, currentWbs) : [];
    
    // Calculate total: if has children, sum children. Else calc own cost.
    let total = 0;
    if (subItems.length > 0) {
      total = subItems.reduce((sum, child) => sum + child.total, 0);
    } else {
      total = (item.quantity || 0) * (item.unitPrice || 0);
    }

    return {
      id: generateId(),
      wbsCode: currentWbs,
      description: item.description,
      quantity: item.quantity || 1,
      unit: item.unit || 'ls',
      unitPrice: item.unitPrice || 0,
      category: (item.category as CostCategory) || CostCategory.MATERIAL,
      total: total,
      notes: item.notes || "",
      expanded: true,
      subItems: subItems
    };
  });
};

export const generateEstimateItems = async (
  description: string
): Promise<EstimateItem[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const itemSchema = {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING },
      quantity: { type: Type.NUMBER },
      unit: { type: Type.STRING },
      unitPrice: { type: Type.NUMBER },
      category: { 
        type: Type.STRING, 
        enum: ["Labor", "Material", "Equipment", "Subcontractor", "Indirect"] 
      },
      notes: { type: Type.STRING },
      subItems: { 
        type: Type.ARRAY,
        items: { 
          type: Type.OBJECT, 
          // Recursive reference isn't fully supported in all schema validators, 
          // so we define one level deep explicitly for the prompt
          properties: {
            description: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            unitPrice: { type: Type.NUMBER },
            category: { type: Type.STRING },
            subItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } } }
          }
        } 
      }
    },
    required: ["description", "category"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a hierarchical construction cost estimate (WBS) for: ${description}. 
      
      Rules:
      1. Group items logically (e.g., "Foundation" -> "Excavation", "Rebar", "Pour").
      2. Only leaf nodes (items without children) should have specific prices. Parent nodes are summaries.
      3. Provide realistic quantities and market rates (USD).
      4. Return a JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: itemSchema
        }
      }
    });

    const rawItems = JSON.parse(response.text || "[]");
    return processAIItems(rawItems);

  } catch (error) {
    console.error("Error generating estimate:", error);
    throw error;
  }
};

export const analyzeRisk = async (items: EstimateItem[]): Promise<string> => {
  if (!process.env.API_KEY) return "API Key missing.";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Flatten items for analysis context
  const flatten = (list: EstimateItem[]): string[] => {
    return list.flatMap(i => {
        const self = `${i.wbsCode} ${i.description} - $${i.total}`;
        const children = i.subItems ? flatten(i.subItems) : [];
        return [self, ...children];
    });
  }
  
  const summary = flatten(items).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Senior Estimator. Analyze this WBS structure for risks.
      
      Data:
      ${summary}

      Provide:
      1. Missing Scope (what is normally included but missing here?)
      2. Cost Anomalies (items that look too cheap/expensive)
      3. Risk Rating (Low/Medium/High)
      
      Keep it professional and concise.`,
    });
    return response.text || "No analysis available.";
  } catch (e) {
    return "Failed to analyze risk.";
  }
}