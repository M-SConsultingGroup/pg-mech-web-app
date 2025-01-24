'use client';
import React, { useEffect, useState } from 'react';

import { TimeEntry, UserHours } from '@/common/interfaces';
import { getWeekNumber } from '@/common/helperFunctions';

export default function UserHoursPage() {
  const [userHours, setUserHours] = useState<UserHours>({});
  const [showPastWeek, setShowPastWeek] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchTimeEntries = async (weekNumber: number) => {
      const response = await fetch(`/api/time-entry?week=${weekNumber}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        method: 'GET',
      });
      const timeEntries: TimeEntry[] = await response.json();

      console.log(timeEntries);

      const hours: UserHours = {};

      timeEntries.forEach((entry) => {
        entry.timeRanges.forEach((range) => {
          if (!range.endTime) return;

          const startTime = new Date(range.startTime);
          const endTime = new Date(range.endTime);
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const week = getWeekNumber(startTime);

          if (!hours[entry.user]) {
            hours[entry.user] = { total: 0, weekly: {} };
          }

          if (!hours[entry.user].weekly[week]) {
            hours[entry.user].weekly[week] = 0;
          }

          hours[entry.user].total += duration;
          hours[entry.user].weekly[week] += duration;
        });
      });

      setUserHours(hours);
    };

    const currentWeek = getWeekNumber(new Date());
    fetchTimeEntries(currentWeek - weekOffset);
  }, [weekOffset]);

  const toggleWeek = () => {
    setWeekOffset((prevOffset) => prevOffset + 1);
    setShowPastWeek(!showPastWeek);
  };

  const currentWeek = getWeekNumber(new Date());

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Hours</h1>
      <button onClick={toggleWeek} className="mb-4 p-2 bg-blue-500 text-white rounded">
        {showPastWeek ? 'Show Current Week' : 'Show Past Week'}
      </button>
      <table className="min border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 pr-4">User</th>
            <th className="border border-gray-400 p-2 pr-4">Week</th>
            <th className="border border-gray-400 p-2 pr-4">Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(userHours).map(([user, hours]) => (
            <tr key={user}>
              <td className="border border-gray-400 p-2 pr-4">{user}</td>
              <td className="border border-gray-400 p-2 pr-4">
                {showPastWeek ? hours.weekly[currentWeek - 1]?.toFixed(2) : hours.weekly[currentWeek]?.toFixed(2)}
              </td>
              <td className="border border-gray-400 p-2 pr-4">{hours.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}