export const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000);
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};