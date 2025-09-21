import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toWords } from 'number-to-words';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function numberToWords(num: number): string {
    if (num === 0) return 'Zero Taka Only';
    const taka = Math.floor(num);
    const poisha = Math.round((num - taka) * 100);

    let words = toWords(taka)
        .replace(/\b\w/g, char => char.toUpperCase()) + ' Taka';

    if (poisha > 0) {
        words += ' And ' + toWords(poisha).replace(/\b\w/g, char => char.toUpperCase()) + ' Poisha';
    }

    return words + ' Only';
}

export function numberToWordsBn(num: number): string {
    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
    const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চোদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ'];

    const convertLessThanHundred = (n: number) => {
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        const unit = n % 10;
        const ten = Math.floor(n / 10);
        return tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
    };
    
    const convert = (n: number) => {
        if (n === 0) return '';
        if (n < 100) return convertLessThanHundred(n);

        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        let str = units[hundred] + ' শত';
        if (remainder > 0) {
            str += ' ' + convertLessThanHundred(remainder);
        }
        return str;
    };

    if (num === 0) return 'শূন্য টাকা মাত্র';
    
    let taka = Math.floor(num);
    let takaInWords = '';

    if (taka >= 10000000) {
        const crore = Math.floor(taka / 10000000);
        takaInWords += convert(crore) + ' কোটি ';
        taka %= 10000000;
    }
    if (taka >= 100000) {
        const lakh = Math.floor(taka / 100000);
        takaInWords += convert(lakh) + ' লাখ ';
        taka %= 100000;
    }
    if (taka >= 1000) {
        const thousand = Math.floor(taka / 1000);
        takaInWords += convert(thousand) + ' হাজার ';
        taka %= 1000;
    }
    if (taka > 0) {
        takaInWords += convert(taka);
    }
    
    return takaInWords.trim().replace(/\s+/g, ' ') + ' টাকা মাত্র';
}