import { Injectable, Logger } from '@nestjs/common';

export interface MarketHours {
  open: string; // HH:mm format
  close: string; // HH:mm format
}

export interface MarketStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'pre-market' | 'after-hours';
  nextOpen: Date;
  nextClose: Date;
  timeUntilNextOpen?: number; // milliseconds
  timeUntilNextClose?: number; // milliseconds
}

export interface TradingSchedule {
  regularHours: MarketHours;
  preMarket?: MarketHours;
  afterHours?: MarketHours;
  allowPreMarket: boolean;
  allowAfterHours: boolean;
  timezone: string;
}

@Injectable()
export class MarketHoursService {
  private readonly logger = new Logger(MarketHoursService.name);

  // NYSE/NASDAQ regular trading hours (Eastern Time)
  private readonly DEFAULT_SCHEDULE: TradingSchedule = {
    regularHours: { open: '09:30', close: '16:00' },
    preMarket: { open: '04:00', close: '09:30' },
    afterHours: { open: '16:00', close: '20:00' },
    allowPreMarket: false,
    allowAfterHours: false,
    timezone: 'America/New_York',
  };

  // US Stock Market Holidays (2024-2025)
  private readonly MARKET_HOLIDAYS = [
    '2024-01-01', // New Year's Day
    '2024-01-15', // Martin Luther King Jr. Day
    '2024-02-19', // Presidents Day
    '2024-03-29', // Good Friday
    '2024-05-27', // Memorial Day
    '2024-06-19', // Juneteenth
    '2024-07-04', // Independence Day
    '2024-09-02', // Labor Day
    '2024-11-28', // Thanksgiving
    '2024-11-29', // Day after Thanksgiving (early close)
    '2024-12-24', // Christmas Eve (early close)
    '2024-12-25', // Christmas Day
    '2025-01-01', // New Year's Day 2025
    '2025-01-20', // Martin Luther King Jr. Day
    '2025-02-17', // Presidents Day
    '2025-04-18', // Good Friday
    '2025-05-26', // Memorial Day
    '2025-06-19', // Juneteenth
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-11-27', // Thanksgiving
    '2025-11-28', // Day after Thanksgiving
    '2025-12-24', // Christmas Eve
    '2025-12-25', // Christmas Day
  ];

  // Early close days (1:00 PM ET close)
  private readonly EARLY_CLOSE_DAYS = [
    '2024-11-29', // Day after Thanksgiving
    '2024-12-24', // Christmas Eve
    '2025-11-28', // Day after Thanksgiving
    '2025-12-24', // Christmas Eve
  ];

  constructor() {
    this.logger.log('Market Hours Service initialized');
  }

  /**
   * Check if the market is currently open
   */
  isMarketOpen(date?: Date, schedule?: TradingSchedule): boolean {
    const status = this.getMarketStatus(date, schedule);
    return status.isOpen;
  }

  /**
   * Get comprehensive market status
   */
  getMarketStatus(date?: Date, schedule?: TradingSchedule): MarketStatus {
    const now = date || new Date();
    const tradingSchedule = schedule || this.DEFAULT_SCHEDULE;

    // Convert to Eastern Time
    const easternTime = new Date(
      now.toLocaleString('en-US', { timeZone: tradingSchedule.timezone }),
    );

    const dateStr = easternTime.toISOString().split('T')[0];
    const timeStr = easternTime.toTimeString().slice(0, 5); // HH:mm
    const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday

    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return this.getClosedStatus(easternTime, tradingSchedule);
    }

    // Check if it's a market holiday
    if (this.MARKET_HOLIDAYS.includes(dateStr)) {
      return this.getClosedStatus(easternTime, tradingSchedule);
    }

    // Check for early close
    const isEarlyClose = this.EARLY_CLOSE_DAYS.includes(dateStr);
    const closeTime = isEarlyClose
      ? '13:00'
      : tradingSchedule.regularHours.close;

    // Determine market status
    const openTime = tradingSchedule.regularHours.open;

    if (timeStr >= openTime && timeStr < closeTime) {
      // Regular market hours
      return {
        isOpen: true,
        status: 'open',
        nextOpen: this.getNextMarketOpen(easternTime, tradingSchedule),
        nextClose: this.getNextMarketClose(
          easternTime,
          tradingSchedule,
          isEarlyClose,
        ),
        timeUntilNextClose: this.getTimeUntil(easternTime, closeTime),
      };
    } else if (
      tradingSchedule.allowPreMarket &&
      tradingSchedule.preMarket &&
      timeStr >= tradingSchedule.preMarket.open &&
      timeStr < openTime
    ) {
      // Pre-market hours
      return {
        isOpen: true,
        status: 'pre-market',
        nextOpen: this.getNextMarketOpen(easternTime, tradingSchedule),
        nextClose: this.getNextMarketClose(
          easternTime,
          tradingSchedule,
          isEarlyClose,
        ),
        timeUntilNextOpen: this.getTimeUntil(easternTime, openTime),
      };
    } else if (
      tradingSchedule.allowAfterHours &&
      tradingSchedule.afterHours &&
      timeStr >= closeTime &&
      timeStr < tradingSchedule.afterHours.close
    ) {
      // After-hours trading
      return {
        isOpen: true,
        status: 'after-hours',
        nextOpen: this.getNextMarketOpen(easternTime, tradingSchedule),
        nextClose: this.getNextMarketClose(
          easternTime,
          tradingSchedule,
          isEarlyClose,
        ),
        timeUntilNextClose: this.getTimeUntil(
          easternTime,
          tradingSchedule.afterHours.close,
        ),
      };
    } else {
      // Market is closed
      return this.getClosedStatus(easternTime, tradingSchedule);
    }
  }

  /**
   * Validate if trading is allowed at current time
   */
  validateTradingHours(
    throwError: boolean = true,
    date?: Date,
    schedule?: TradingSchedule,
  ): boolean {
    const status = this.getMarketStatus(date, schedule);

    if (!status.isOpen) {
      const message = this.getMarketClosedMessage(status);
      this.logger.warn(`Trading blocked: ${message}`);

      if (throwError) {
        throw new Error(message);
      }
      return false;
    }

    return true;
  }

  /**
   * Get time until market opens/closes in a human-readable format
   */
  getTimeUntilMarketEvent(date?: Date): string {
    const status = this.getMarketStatus(date);

    if (status.isOpen && status.timeUntilNextClose) {
      return this.formatDuration(status.timeUntilNextClose);
    } else if (!status.isOpen && status.timeUntilNextOpen) {
      return this.formatDuration(status.timeUntilNextOpen);
    }

    return 'Unknown';
  }

  /**
   * Check if given date is a trading day
   */
  isTradingDay(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    return (
      dayOfWeek !== 0 && // Not Sunday
      dayOfWeek !== 6 && // Not Saturday
      !this.MARKET_HOLIDAYS.includes(dateStr)
    );
  }

  /**
   * Get next trading day
   */
  getNextTradingDay(date?: Date): Date {
    const current = date ? new Date(date) : new Date();
    const nextDay = new Date(current);
    nextDay.setDate(nextDay.getDate() + 1);

    while (!this.isTradingDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  /**
   * Enable/disable extended hours trading
   */
  updateTradingSchedule(
    allowPreMarket: boolean,
    allowAfterHours: boolean,
  ): TradingSchedule {
    return {
      ...this.DEFAULT_SCHEDULE,
      allowPreMarket,
      allowAfterHours,
    };
  }

  // Private helper methods
  private getClosedStatus(
    easternTime: Date,
    schedule: TradingSchedule,
  ): MarketStatus {
    return {
      isOpen: false,
      status: 'closed',
      nextOpen: this.getNextMarketOpen(easternTime, schedule),
      nextClose: this.getNextMarketClose(easternTime, schedule),
      timeUntilNextOpen: this.getTimeUntil(
        easternTime,
        this.getNextMarketOpen(easternTime, schedule),
      ),
    };
  }

  private getNextMarketOpen(date: Date, schedule: TradingSchedule): Date {
    const nextTradingDay = this.getNextTradingDay(date);
    const [hours, minutes] = schedule.regularHours.open.split(':').map(Number);

    const nextOpen = new Date(nextTradingDay);
    nextOpen.setHours(hours, minutes, 0, 0);

    return nextOpen;
  }

  private getNextMarketClose(
    date: Date,
    schedule: TradingSchedule,
    isEarlyClose: boolean = false,
  ): Date {
    const closeTime = isEarlyClose ? '13:00' : schedule.regularHours.close;
    const [hours, minutes] = closeTime.split(':').map(Number);

    const nextClose = new Date(date);
    nextClose.setHours(hours, minutes, 0, 0);

    // If close time has passed today, get next trading day's close
    if (nextClose <= date) {
      const nextTradingDay = this.getNextTradingDay(date);
      nextClose.setTime(nextTradingDay.getTime());
      nextClose.setHours(hours, minutes, 0, 0);
    }

    return nextClose;
  }

  private getTimeUntil(from: Date, to: Date | string): number {
    if (typeof to === 'string') {
      const [hours, minutes] = to.split(':').map(Number);
      const targetTime = new Date(from);
      targetTime.setHours(hours, minutes, 0, 0);

      if (targetTime <= from) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      return targetTime.getTime() - from.getTime();
    }

    return to.getTime() - from.getTime();
  }

  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private getMarketClosedMessage(status: MarketStatus): string {
    const timeUntilOpen = status.timeUntilNextOpen
      ? this.formatDuration(status.timeUntilNextOpen)
      : 'unknown';

    return `Market is currently closed. Next opening in ${timeUntilOpen} at ${status.nextOpen.toLocaleString(
      'en-US',
      {
        timeZone: 'America/New_York',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      },
    )}`;
  }
}
