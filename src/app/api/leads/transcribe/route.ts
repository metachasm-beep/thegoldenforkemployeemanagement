import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleGenAI } from '@google/genai';
import { getCustomFieldDefinitions } from '@/services/customFieldService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is not configured on the server.' }, { status: 500 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    
    // Determine mime type (default to webm if missing)
    const mimeType = audioFile.type || 'audio/webm';

    const customFields = await getCustomFieldDefinitions('LEAD');
    const customFieldsSchema = customFields.map(f => `${f.name} (${f.type}${f.options ? `, options: ${f.options}` : ''})`).join(', ');

    const today = new Date().toISOString().split('T')[0];

    const prompt = `
You are an expert CRM assistant. Listen to the provided audio of a sales executive describing a lead. 
Extract the information into a strict JSON object with the following keys:
- "name": (string) The name of the lead or company.
- "email": (string) The email address if mentioned.
- "phone": (string) The phone number if mentioned.
- "linkedIn": (string) LinkedIn URL or handle if mentioned.
- "status": (string) Must be one of ['Lead Captured', 'Proposal Sent', 'Pending Verification', 'Converted', 'Lost'].
- "notes": (string) A comprehensive summary of the interaction.
- "followUp": (string) Calculate the exact YYYY-MM-DD date based on the user's temporal references (e.g., "next Tuesday"). Use today's date (${today}) as a reference.
- "customFields": (object) Map any other mentioned details to these custom fields: { ${customFieldsSchema} }. Only include keys for fields that were explicitly mentioned.

If a piece of information is missing, leave the field blank or null. 
Return ONLY valid JSON without markdown wrapping.`;

    // Using gemini-3.8-flash as the active production model
    const model = 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Audio, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('No text returned from Gemini');
    }

    const data = JSON.parse(jsonText);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
