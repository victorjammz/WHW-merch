import { format } from 'date-fns';

interface DateFormatOptions {
  dateFormat?: string;
  timezone?: string;
}

export const formatDateWithUserSettings = (
  date: string | Date,
  userDateFormat: string = 'MM/dd/yyyy'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // If date is invalid, return original string
    if (isNaN(dateObj.getTime())) {
      return typeof date === 'string' ? date : '';
    }

    // Map user-friendly formats to date-fns formats
    const formatMap: Record<string, string> = {
      'MM/dd/yyyy': 'MM/dd/yyyy',
      'dd/MM/yyyy': 'dd/MM/yyyy',
      'yyyy-MM-dd': 'yyyy-MM-dd',
      'dd-MM-yyyy': 'dd-MM-yyyy',
      'MM-dd-yyyy': 'MM-dd-yyyy',
      'dd.MM.yyyy': 'dd.MM.yyyy',
      'yyyy/MM/dd': 'yyyy/MM/dd',
      'MMM dd, yyyy': 'MMM dd, yyyy',
      'dd MMM yyyy': 'dd MMM yyyy',
      'MMMM dd, yyyy': 'MMMM dd, yyyy',
      'dd MMMM yyyy': 'dd MMMM yyyy'
    };

    const formatString = formatMap[userDateFormat] || 'MM/dd/yyyy';
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return typeof date === 'string' ? date : '';
  }
};

export const getAvailableDateFormats = () => {
  const sampleDate = new Date('2024-01-15');
  
  return [
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY', example: format(sampleDate, 'MM/dd/yyyy') },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY', example: format(sampleDate, 'dd/MM/yyyy') },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD', example: format(sampleDate, 'yyyy-MM-dd') },
    { value: 'dd-MM-yyyy', label: 'DD-MM-YYYY', example: format(sampleDate, 'dd-MM-yyyy') },
    { value: 'MM-dd-yyyy', label: 'MM-DD-YYYY', example: format(sampleDate, 'MM-dd-yyyy') },
    { value: 'dd.MM.yyyy', label: 'DD.MM.YYYY', example: format(sampleDate, 'dd.MM.yyyy') },
    { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD', example: format(sampleDate, 'yyyy/MM/dd') },
    { value: 'MMM dd, yyyy', label: 'Jan 15, 2024', example: format(sampleDate, 'MMM dd, yyyy') },
    { value: 'dd MMM yyyy', label: '15 Jan 2024', example: format(sampleDate, 'dd MMM yyyy') },
    { value: 'MMMM dd, yyyy', label: 'January 15, 2024', example: format(sampleDate, 'MMMM dd, yyyy') },
    { value: 'dd MMMM yyyy', label: '15 January 2024', example: format(sampleDate, 'dd MMMM yyyy') }
  ];
};