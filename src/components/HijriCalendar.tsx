import React, { useState } from 'react';
import { Calendar, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

interface HijriCalendarProps {
  studentId: string;
  attendance: any[];
}

export function getHijriDateDetails(date: Date) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1447', 10);
    
    const hijriMonthsArabic = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    
    return {
      day,
      month,
      year,
      monthName: hijriMonthsArabic[month - 1] || 'غير معروف'
    };
  } catch (e) {
    // Graceful fallback
    const hijriMonthsArabic = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    const fallbackMonth = date.getMonth();
    return {
      day: date.getDate(),
      month: fallbackMonth + 1,
      year: 1447,
      monthName: hijriMonthsArabic[fallbackMonth] || 'شعبان'
    };
  }
}

function getSundayOfWeek(d: Date): Date {
  const sunday = new Date(d);
  const day = d.getDay();
  sunday.setDate(d.getDate() - day);
  return sunday;
}

export default function HijriCalendar({ studentId, attendance }: HijriCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filter attendance for this student
  const studentAttendance = attendance.filter(a => a.studentId === studentId);

  const getYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate 5 school days (Sunday to Thursday) of the selected week
  const sunday = getSundayOfWeek(currentDate);
  const weekDays = [];
  const dayNamesArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const hj = getHijriDateDetails(d);
    
    // Find matching attendance record (using timezone-proof formatted string comparison)
    const targetDateStr = getYYYYMMDD(d);
    const record = studentAttendance.find(a => a.date && a.date.startsWith(targetDateStr));

    weekDays.push({
      gregorianDate: d,
      hijriDay: hj.day,
      hijriMonth: hj.month,
      hijriYear: hj.year,
      hijriMonthName: hj.monthName,
      dayName: dayNamesArabic[i],
      record
    });
  }

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Weekly stats
  const weeklyAbsences = weekDays.filter(wd => wd.record?.status === 'absent').length;
  const weeklyLates = weekDays.filter(wd => wd.record?.status === 'late').length;

  // Build the elegant Header text showing the Hijri Range of the current week
  const firstDay = weekDays[0];
  const lastDay = weekDays[4];
  let hijriWeekSpan = '';
  if (firstDay && lastDay) {
    if (firstDay.hijriMonthName === lastDay.hijriMonthName) {
      hijriWeekSpan = `${firstDay.hijriDay} - ${lastDay.hijriDay} ${firstDay.hijriMonthName} ${firstDay.hijriYear}هـ`;
    } else {
      hijriWeekSpan = `${firstDay.hijriDay} ${firstDay.hijriMonthName} - ${lastDay.hijriDay} ${lastDay.hijriMonthName} ${firstDay.hijriYear}هـ`;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3 sm:p-4 space-y-2.5 text-right w-full max-w-[320px] xs:max-w-[350px] mx-auto select-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-1.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="text-indigo-600 shrink-0" size={15} />
          <div>
            <h4 className="font-extrabold text-[12px] sm:text-[13px] text-slate-800 leading-tight">التقويم الأسبوعي الهجري</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none mt-0.5">متابعة الغياب والتأخر الأسبوعي</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-0.5">
          <button 
            onClick={handlePrevWeek}
            className="p-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 transition-colors cursor-pointer"
            title="الأسبوع السابق"
          >
            <ChevronRight size={13} />
          </button>
          <span className="text-[10px] sm:text-[11px] font-black text-slate-850 px-2 py-1 text-center bg-slate-50 border border-slate-100 rounded-md min-w-[85px] sm:min-w-[95px] leading-tight" title={hijriWeekSpan}>
            {hijriWeekSpan}
          </span>
          <button 
            onClick={handleNextWeek}
            className="p-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 transition-colors cursor-pointer"
            title="الأسبوع التالي"
          >
            <ChevronLeft size={13} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:text-[12px]">
        <div className="bg-rose-50/50 border border-rose-100 rounded-lg py-1 px-2 text-center flex items-center justify-between">
          <span className="font-bold text-rose-500 font-sans">الغياب الأسبوعي</span>
          <span className="font-black text-rose-600 font-mono">{weeklyAbsences}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg py-1 px-2 text-center flex items-center justify-between">
          <span className="font-bold text-amber-600 font-sans">التأخر الأسبوعي</span>
          <span className="font-black text-amber-700 font-mono">{weeklyLates}</span>
        </div>
      </div>

      {/* Hijri Calendar 5-day Vertical List */}
      <div className="flex flex-col gap-1.5 pt-1.5">
        {weekDays.map((wd, index) => {
          const dayRecord = wd.record;
          const status = dayRecord?.status;
          const hasRecord = !!dayRecord;

          let cellClass = 'border-slate-150 bg-slate-50/30 text-slate-400 hover:bg-slate-50/60';
          let indicatorElement = null;

          if (hasRecord) {
            if (status === 'absent') {
              cellClass = 'border-rose-200 bg-rose-50 text-rose-700 font-extrabold shadow-sm';
              indicatorElement = <span className="text-[11px] sm:text-[12px] font-black text-rose-600 bg-rose-100/90 px-2 py-0.5 rounded leading-none">غياب</span>;
            } else if (status === 'late') {
              cellClass = 'border-amber-200 bg-amber-50 text-amber-800 font-extrabold shadow-sm';
              indicatorElement = <span className="text-[11px] sm:text-[12px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded leading-none">تأخر</span>;
            } else if (status === 'present') {
              cellClass = 'border-emerald-150 bg-emerald-50/50 text-emerald-700 font-semibold';
              indicatorElement = (
                <div className="flex items-center gap-1.5 bg-emerald-100/65 px-2 py-0.5 rounded">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[11px] sm:text-[12px] font-bold text-emerald-700 leading-none">حضور</span>
                </div>
              );
            } else if (['restroom', 'with_deputy', 'with_counselor'].includes(status || '')) {
              cellClass = 'border-purple-200 bg-purple-50 text-purple-700 font-semibold';
              indicatorElement = <span className="text-[11px] sm:text-[12px] font-medium text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded leading-none">إذن</span>;
            }
          } else {
            indicatorElement = <span className="text-[11px] sm:text-[12px] text-slate-350 leading-none">-</span>;
          }

          return (
            <div 
              key={index}
              className={`border rounded-lg p-1.5 sm:p-2 px-2.5 flex items-center justify-between transition-all gap-1.5 ${cellClass}`}
              title={dayRecord ? `اليوم: ${wd.hijriDay} - ${status}` : `اليوم الهجري: ${wd.hijriDay}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] sm:text-[11.5px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded min-w-[42px] text-center">{wd.dayName}</span>
                <span className="text-[11.5px] sm:text-[12.5px] font-black text-slate-700 leading-none bg-white border border-slate-150 rounded-full w-5 h-5 sm:w-5.5 sm:h-5.5 flex items-center justify-center font-mono">{wd.hijriDay}</span>
              </div>
              <div>
                {indicatorElement}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 items-center justify-center text-[10px] text-slate-400 font-bold bg-slate-50 p-1.5 rounded-lg border border-slate-100">
        <AlertCircle size={11} className="shrink-0" />
        <span className="leading-none text-center">حضور وغياب الطالب بتواريخ أم القرى (مستثنى الجمعة والسبت).</span>
      </div>
    </div>
  );
}
