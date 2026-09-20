import React from 'react';

export const StatusBadge = ({ type, value }) => {
  let badgeClass = 'badge-yellow';
  let label = value;

  if (type === 'urgency') {
    switch (value) {
      case 'CRITICAL':
        badgeClass = 'badge-red';
        label = '🔴 Critical';
        break;
      case 'HIGH':
        badgeClass = 'badge-orange';
        label = '🟠 High';
        break;
      case 'MODERATE':
      default:
        badgeClass = 'badge-yellow';
        label = '🟡 Moderate';
        break;
    }
  } else if (type === 'status') {
    switch (value) {
      case 'MATCHED':
      case 'DELIVERED':
        badgeClass = 'badge-green';
        label = `🟢 ${value}`;
        break;
      case 'MATCHING':
      case 'ASSIGNED':
        badgeClass = 'badge-blue';
        label = `🔵 ${value}`;
        break;
      case 'CANCELLED':
        badgeClass = 'badge-red';
        label = `🔴 ${value}`;
        break;
      case 'PENDING':
      default:
        badgeClass = 'badge-yellow';
        label = `🟡 ${value}`;
        break;
    }
  } else if (type === 'resource') {
    return (
      <span className="badge badge-yellow">
        {value}
      </span>
    );
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {label}
    </span>
  );
};
