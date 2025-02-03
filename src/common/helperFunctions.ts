export const getWeekNumber = (date: Date) => {
    // Convert date to CST
    const cstDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const startOfYear = new Date(cstDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (cstDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000);
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};