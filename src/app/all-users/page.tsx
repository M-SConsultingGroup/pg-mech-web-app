'use client';
import React, { useEffect, useState } from 'react';

interface TimeEntry {
  user: string;
  ticket: { ticketNumber: string };
  startTime: string;
  endTime: string;
}

interface UserHours {
  [user: string]: number;
}

export default function UserHoursPage() {
  const [userHours, setUserHours] = useState<UserHours>({});

  useEffect(() => {
    const fetchTimeEntries = async () => {
      const response = await fetch('/api/timeEntries');
      const timeEntries: TimeEntry[] = await response.json();

      const hours: UserHours = {};

      timeEntries.forEach((entry) => {
        const startTime = new Date(entry.startTime);
        const endTime = new Date(entry.endTime);
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // duration in hours

        if (!hours[entry.user]) {
          hours[entry.user] = 0;
        }

        hours[entry.user] += duration;
      });

      setUserHours(hours);
    };

    fetchTimeEntries();
  }, []);

  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Hours</h1>
      <table className="min border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border border-gray-400 p-2 pr-4">User</th>
            <th className="border border-gray-400 p-2 pr-4">Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(userHours).map(([user, hours]) => (
            <tr key={user}>
              <td className="border border-gray-400 p-2 pr-4">{user}</td>
              <td className="border border-gray-400 p-2 pr-4">{hours.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}