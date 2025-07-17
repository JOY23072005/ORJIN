// utils/judge0.ts
const RAPIDAPI_KEY = import.meta.env.VITE_API_KEY;
const JUDGE0_HOST = import.meta.env.VITE_API_HOST;
const JUDGE0_BASE = `https://${JUDGE0_HOST}`;

const languageMap: Record<string, number> = {
  'js': 63,        // Node.js
  'py': 71,        // Python 3
  'cpp': 54,       // C++
  'c': 50,         // C
  'java': 62,      // Java
  'ts': 74,        // TypeScript
  'rb': 72,        // Ruby
  'go': 60,        // Go
  'rs': 73,        // Rust
};

// Languages that commonly have encoding issues and need base64
const BINARY_OUTPUT_LANGUAGES = [54, 50]; // C++ and C

export const getLanguageId = async (ext: string): Promise<number | null> => {
  if (languageMap[ext]) return languageMap[ext];

  try {
    const response = await fetch(`${JUDGE0_BASE}/languages`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': JUDGE0_HOST
      }
    });
    const data = await response.json();

    const lang = data.find((lang: any) => lang.name.toLowerCase().includes(ext.toLowerCase()));
    return lang?.id || null;
  } catch (err) {
    console.error('Language fetch error:', err);
    return null;
  }
};

export const runCode = async ({
  sourceCode,
  languageId,
  stdin = ''
}: {
  sourceCode: string;
  languageId: number;
  stdin?: string;
}) => {
  try {
    // Check if this language needs base64 encoding
    const useBase64 = BINARY_OUTPUT_LANGUAGES.includes(languageId);
    
    // Prepare the request body
    const requestBody = {
      source_code: useBase64 ? btoa(sourceCode) : sourceCode,
      language_id: languageId,
      stdin: stdin ? (useBase64 ? btoa(stdin) : stdin) : ''
    };

    // 1. Submit the code with appropriate base64 setting
    const submission = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=${useBase64}&wait=true`, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': JUDGE0_HOST,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!submission.ok) {
      throw new Error(`HTTP error! status: ${submission.status}`);
    }

    const result = await submission.json();
    
    // If we used base64 encoding, decode the outputs
    if (useBase64 && result) {
      if (result.stdout) {
        try {
          result.stdout = atob(result.stdout);
        } catch (e) {
          console.warn('Failed to decode base64 stdout:', e);
        }
      }
      if (result.stderr) {
        try {
          result.stderr = atob(result.stderr);
        } catch (e) {
          console.warn('Failed to decode base64 stderr:', e);
        }
      }
      if (result.compile_output) {
        try {
          result.compile_output = atob(result.compile_output);
        } catch (e) {
          console.warn('Failed to decode base64 compile_output:', e);
        }
      }
    }

    return result;
  } catch (err) {
    console.error('Code execution error:', err);
    
    // If it's a UTF-8 error, provide a helpful message
    if (err) {
      return {
        error: 'Program output contains non-UTF-8 characters. This is common with C/C++ programs that output binary data.',
        status: { description: 'Encoding Error' }
      };
    }
    
    return {
      error: err || 'Unknown error occurred',
      status: { description: 'Execution Error' }
    };
  }
};