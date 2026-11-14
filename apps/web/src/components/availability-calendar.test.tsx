import { cleanup, render, screen, within } from "@testing-library/react";
import type { Slot } from "@calendar/api-client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MOSCOW_TIME_ZONE_NOTE } from "@/lib/moscow-time";

import { AvailabilityCalendar } from "./availability-calendar";

const days = [
  {
    date: "2026-11-15",
    freeSlotsCount: 1,
    slots: [
      {
        start: "2026-11-15T06:00:00.000Z",
        end: "2026-11-15T06:15:00.000Z",
        available: true,
      },
      {
        start: "2026-11-15T06:15:00.000Z",
        end: "2026-11-15T06:30:00.000Z",
        available: false,
      },
    ],
  },
];

const timeZoneNote = MOSCOW_TIME_ZONE_NOTE;

afterEach(cleanup);

function renderCalendar(calendarDays = days) {
  return render(
    <AvailabilityCalendar
      days={calendarDays}
      onSelectDate={vi.fn<(date: string) => void>()}
      onSelectSlot={vi.fn<(slot: Slot) => void>()}
      selectedDate="2026-11-15"
      selectedSlot={undefined}
    />,
  );
}

describe("AvailabilityCalendar", () => {
  it("shows free slot counts and disables occupied slots", () => {
    renderCalendar();

    expect(screen.getByText("1 свободно")).toBeInTheDocument();

    const freeSlot = screen.getByRole("button", { name: /09:00/ });
    expect(freeSlot).toBeEnabled();
    expect(within(freeSlot).getByText("Свободно")).toBeInTheDocument();

    const occupiedSlot = screen.getByRole("button", { name: /09:15/ });
    expect(occupiedSlot).toBeDisabled();
    expect(within(occupiedSlot).getByText("Занято")).toBeInTheDocument();
  });

  it("shows the Moscow time note once outside the slot buttons", () => {
    renderCalendar();

    expect(screen.getAllByText(timeZoneNote)).toHaveLength(1);

    const freeSlot = screen.getByRole("button", { name: /09:00/ });
    expect(within(freeSlot).queryByText(timeZoneNote)).not.toBeInTheDocument();

    const occupiedSlot = screen.getByRole("button", { name: /09:15/ });
    expect(within(occupiedSlot).queryByText(timeZoneNote)).not.toBeInTheDocument();
  });

  it("keeps the empty-days message without the note when there are no days", () => {
    renderCalendar([]);

    expect(screen.getByText("Свободных дней пока нет.")).toBeInTheDocument();
    expect(screen.queryByText(timeZoneNote)).not.toBeInTheDocument();
  });
});
