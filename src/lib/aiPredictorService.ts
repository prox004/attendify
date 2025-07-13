// lib/aiPredictorService.ts
import { AttendanceEntry } from '@/types/attendance';
import { SubjectWithAttendance } from '@/hooks/useAttendanceData';

export interface AttendancePrediction {
  subjectId: string;
  subjectName: string;
  currentPercentage: number;
  predictedPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
  classesToAttend: number;
  classesToMiss: number;
}

export interface OverallPrediction {
  averageAttendance: number;
  predictedAverage: number;
  atRiskSubjects: number;
  recommendations: string[];
  insights: string[];
}

// Simple AI predictor based on attendance patterns
export const predictAttendance = (subjects: SubjectWithAttendance[]): {
  predictions: AttendancePrediction[];
  overall: OverallPrediction;
} => {
  const predictions: AttendancePrediction[] = subjects.map(subject => {
    const { attendanceEntries, presentClasses, totalScheduledClasses, actualAttendancePercentage } = subject;
    
    // Calculate trend based on recent attendance
    const recentEntries = attendanceEntries
      .filter(entry => entry.status !== 'off')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    const recentPresentCount = recentEntries.filter(entry => entry.status === 'present').length;
    const recentPercentage = recentEntries.length > 0 ? (recentPresentCount / recentEntries.length) * 100 : 0;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentPercentage > actualAttendancePercentage + 5) {
      trend = 'improving';
    } else if (recentPercentage < actualAttendancePercentage - 5) {
      trend = 'declining';
    }
    
    // Predict future attendance based on trend
    let predictedPercentage = actualAttendancePercentage;
    const remainingWeeks = 10; // Assume 10 weeks remaining in semester
    const classesPerWeek = subject.totalScheduledClasses / 20; // Assume 20 weeks total
    const remainingClasses = Math.ceil(remainingWeeks * classesPerWeek);
    
    if (trend === 'improving') {
      predictedPercentage = Math.min(95, actualAttendancePercentage + 5);
    } else if (trend === 'declining') {
      predictedPercentage = Math.max(0, actualAttendancePercentage - 10);
    }
    
    // Calculate risk level
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (predictedPercentage < 60) {
      risk = 'high';
    } else if (predictedPercentage < 75) {
      risk = 'medium';
    }
    
    // Generate recommendations
    let recommendation = '';
    let classesToAttend = 0;
    let classesToMiss = 0;
    
    if (actualAttendancePercentage < 75) {
      const targetPercentage = 75;
      const totalFutureClasses = totalScheduledClasses + remainingClasses;
      const requiredPresentClasses = Math.ceil((targetPercentage / 100) * totalFutureClasses);
      classesToAttend = Math.max(0, requiredPresentClasses - presentClasses);
      
      recommendation = `Attend ${classesToAttend} more classes to reach 75% attendance.`;
    } else if (actualAttendancePercentage > 85) {
      const minPercentage = 75;
      const totalFutureClasses = totalScheduledClasses + remainingClasses;
      const maxAbsentClasses = Math.floor(totalFutureClasses * (1 - minPercentage / 100));
      const currentAbsentClasses = totalScheduledClasses - presentClasses;
      classesToMiss = Math.max(0, maxAbsentClasses - currentAbsentClasses);
      
      recommendation = `You can miss up to ${classesToMiss} more classes while maintaining 75% attendance.`;
    } else {
      recommendation = 'Maintain current attendance pattern to stay above 75%.';
    }
    
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      currentPercentage: actualAttendancePercentage,
      predictedPercentage,
      trend,
      risk,
      recommendation,
      classesToAttend,
      classesToMiss
    };
  });
  
  // Calculate overall insights
  const averageAttendance = subjects.length > 0 
    ? subjects.reduce((sum, s) => sum + s.actualAttendancePercentage, 0) / subjects.length
    : 0;
  
  const predictedAverage = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.predictedPercentage, 0) / predictions.length
    : 0;
  
  const atRiskSubjects = predictions.filter(p => p.risk === 'high' || p.risk === 'medium').length;
  
  const recommendations: string[] = [];
  const insights: string[] = [];
  
  if (averageAttendance < 75) {
    recommendations.push('Focus on improving attendance in critical subjects');
    recommendations.push('Set daily reminders for classes');
  }
  
  if (atRiskSubjects > 0) {
    recommendations.push(`Prioritize ${atRiskSubjects} at-risk subjects`);
  }
  
  insights.push(`Your average attendance is ${averageAttendance.toFixed(1)}%`);
  insights.push(`Predicted trend: ${predictedAverage > averageAttendance ? 'Improving' : predictedAverage < averageAttendance ? 'Declining' : 'Stable'}`);
  
  const improving = predictions.filter(p => p.trend === 'improving').length;
  const declining = predictions.filter(p => p.trend === 'declining').length;
  
  if (improving > declining) {
    insights.push('Overall trend is positive across subjects');
  } else if (declining > improving) {
    insights.push('Attendance is declining in multiple subjects');
  }
  
  return {
    predictions,
    overall: {
      averageAttendance,
      predictedAverage,
      atRiskSubjects,
      recommendations,
      insights
    }
  };
};

// Generate personalized study schedule
export const generateStudySchedule = (predictions: AttendancePrediction[]): string[] => {
  const schedule: string[] = [];
  
  const highRiskSubjects = predictions.filter(p => p.risk === 'high');
  const mediumRiskSubjects = predictions.filter(p => p.risk === 'medium');
  
  if (highRiskSubjects.length > 0) {
    schedule.push('Morning: Focus on high-risk subjects');
    highRiskSubjects.forEach(subject => {
      schedule.push(`- ${subject.subjectName}: Catch up on missed topics`);
    });
  }
  
  if (mediumRiskSubjects.length > 0) {
    schedule.push('Afternoon: Review medium-risk subjects');
    mediumRiskSubjects.forEach(subject => {
      schedule.push(`- ${subject.subjectName}: Regular revision`);
    });
  }
  
  schedule.push('Evening: Prepare for tomorrow\'s classes');
  
  return schedule;
};
