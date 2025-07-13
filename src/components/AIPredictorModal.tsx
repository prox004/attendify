// components/AIPredictorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { predictAttendance, AttendancePrediction, OverallPrediction } from '@/lib/aiPredictorService';
import { SubjectWithAttendance } from '@/hooks/useAttendanceData';

interface AIPredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectWithAttendance[];
}

const AIPredictorModal = ({ isOpen, onClose, subjects }: AIPredictorModalProps) => {
  const [predictions, setPredictions] = useState<AttendancePrediction[]>([]);
  const [overall, setOverall] = useState<OverallPrediction | null>(null);
  const [activeTab, setActiveTab] = useState<'predictions' | 'insights'>('predictions');

  useEffect(() => {
    if (isOpen && subjects.length > 0) {
      const { predictions: pred, overall: ov } = predictAttendance(subjects);
      setPredictions(pred);
      setOverall(ov);
    }
  }, [isOpen, subjects]);

  if (!isOpen) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'declining': return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      case 'stable': return <MinusIcon className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Attendance Predictor</h2>
              <p className="text-gray-600">Smart insights for your academic success</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'predictions'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Subject Predictions
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 px-6 py-3 text-sm font-medium ${
              activeTab === 'insights'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overall Insights
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {activeTab === 'predictions' ? (
            <div className="space-y-4">
              {predictions.length > 0 ? (
                predictions.map((prediction) => (
                  <div key={prediction.subjectId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">{prediction.subjectName}</h3>
                        {getTrendIcon(prediction.trend)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(prediction.risk)}`}>
                        {prediction.risk.toUpperCase()} RISK
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Current Attendance</p>
                        <p className="text-lg font-bold text-gray-900">{prediction.currentPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Predicted Attendance</p>
                        <p className={`text-lg font-bold ${
                          prediction.predictedPercentage > prediction.currentPercentage
                            ? 'text-green-600'
                            : prediction.predictedPercentage < prediction.currentPercentage
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {prediction.predictedPercentage}%
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Recommendation:</p>
                      <p className="text-sm text-gray-600">{prediction.recommendation}</p>
                    </div>

                    {(prediction.classesToAttend > 0 || prediction.classesToMiss > 0) && (
                      <div className="flex items-center space-x-4 text-xs">
                        {prediction.classesToAttend > 0 && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Attend {prediction.classesToAttend} more classes</span>
                          </div>
                        )}
                        {prediction.classesToMiss > 0 && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Can miss {prediction.classesToMiss} classes</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No prediction data available</p>
                  <p className="text-sm text-gray-400 mt-1">Add subjects and attendance data to get AI insights</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {overall ? (
                <>
                  {/* Overall Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">Current Average</h3>
                      <p className="text-2xl font-bold text-blue-600">{overall.averageAttendance.toFixed(1)}%</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-2">Predicted Average</h3>
                      <p className="text-2xl font-bold text-purple-600">{overall.predictedAverage.toFixed(1)}%</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h3 className="font-semibold text-red-900 mb-2">At-Risk Subjects</h3>
                      <p className="text-2xl font-bold text-red-600">{overall.atRiskSubjects}</p>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">AI Insights</h3>
                    <div className="space-y-2">
                      {overall.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                    <h3 className="font-semibold text-indigo-900 mb-3">Personalized Recommendations</h3>
                    <div className="space-y-2">
                      {overall.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <SparklesIcon className="w-4 h-4 text-indigo-500 mt-0.5" />
                          <p className="text-sm text-indigo-700">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-3">Pro Tips</h3>
                    <div className="space-y-2 text-sm text-yellow-700">
                      <p>• Set daily reminders for classes to improve consistency</p>
                      <p>• Use the campus presence feature to track your college visits</p>
                      <p>• Review your attendance weekly to stay on track</p>
                      <p>• Focus extra attention on subjects below 75% attendance</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Generating insights...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPredictorModal;
