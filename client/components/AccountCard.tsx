import React from 'react';

interface AccountCardProps {
  id: number;
  name: string;
  industry?: string;
  type?: string;
  revenue?: string;
  rating?: string;
  onClick: (id: number) => void;
}

export function AccountCard({ id, name, industry, type, revenue, rating, onClick }: AccountCardProps) {
  const getRatingColor = (rating?: string) => {
    const safeRating = (rating || "").toLowerCase();
    switch (safeRating) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type?: string) => {
    const safeType = (type || "").toLowerCase();
    switch (safeType) {
      case "customer":
        return "bg-green-50 border-green-200";
      case "prospect":
        return "bg-blue-50 border-blue-200";
      case "partner":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div
      onClick={() => onClick(id)}
      className={`aspect-square border-2 ${getTypeColor(type)} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      <div className="flex-1 flex flex-col justify-center text-center">
        <h3 className="font-semibold text-gray-900 mb-2 text-lg break-words">{name}</h3>
        {industry && (
          <p className="text-sm text-gray-600 mb-1">{industry}</p>
        )}
        {revenue && (
          <p className="text-sm font-medium text-gray-800">{revenue}</p>
        )}
      </div>
      <div className="flex justify-between items-end">
        {type && (
          <span className="text-xs px-2 py-1 bg-white rounded-full border capitalize">
            {type}
          </span>
        )}
        {rating && (
          <span className={`text-xs px-2 py-1 rounded-full border ${getRatingColor(rating)}`}>
            {rating}
          </span>
        )}
      </div>
    </div>
  );
}