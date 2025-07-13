// lib/csvParser.ts
import Papa from 'papaparse';

export interface CSVSubject {
  name: string;
}

export const loadSubjectsFromCSV = async (): Promise<string[]> => {
  try {
    const response = await fetch('/subject_list.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        complete: (results) => {
          try {
            // Extract subject names from the first column and filter out empty strings
            const subjects = results.data
              .map((row: any) => row[0])
              .filter((subject: string) => subject && subject.trim().length > 0)
              .map((subject: string) => subject.trim())
              .sort();
            
            resolve(subjects);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        },
        header: false,
        skipEmptyLines: true
      });
    });
  } catch (error) {
    console.error('Error loading CSV:', error);
    // Return a fallback list of common subjects
    return [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'English',
      'History',
      'Geography',
      'Economics',
      'Psychology'
    ].sort();
  }
};
