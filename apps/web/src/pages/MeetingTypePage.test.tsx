import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MeetingTypePage } from "./MeetingTypePage";
import { routes } from "../routes";

const apiMocks = vi.hoisted(() => ({
  createBooking: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@calendar/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@calendar/api-client")>();
  return {
    ...actual,
    getMeetingType: vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: {
        id: "intro-15",
        title: "Встреча 15 минут",
        description: "Короткий звонок",
        durationMinutes: 15,
      },
      error: undefined,
      response: { status: 200 },
    }),
    getAvailability: vi.fn<() => Promise<unknown>>().mockResolvedValue({
      data: {
        days: [
          {
            date: "2026-11-15",
            freeSlotsCount: 1,
            slots: [
              {
                start: "2026-11-15T06:00:00.000Z",
                end: "2026-11-15T06:15:00.000Z",
                available: true,
              },
            ],
          },
        ],
      },
      error: undefined,
      response: { status: 200 },
    }),
    createBooking: apiMocks.createBooking.mockResolvedValue({
      data: undefined,
      error: { error: { code: "slot_taken", message: "Этот слот уже занят" } },
      response: { status: 409 },
    }),
  };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/book/intro-15"]}>
      <Routes>
        <Route element={<MeetingTypePage />} path={routes.bookingType} />
      </Routes>
    </MemoryRouter>,
  );
}

const timeZoneNote = "Время указано по Москве (МСК, UTC+3)";

function getCardByTitle(title: string) {
  const card = screen.getByText(title).closest('[data-slot="card"]');
  if (!card) {
    throw new Error(`Card "${title}" not found`);
  }
  return card as HTMLElement;
}

describe("MeetingTypePage", () => {
  it("shows a conflict message when the selected slot is already taken", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("heading", { name: "Встреча 15 минут" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /09:00/ }));
    await user.type(screen.getByRole("textbox", { name: "Имя" }), "Анна");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "anna@example.com");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Этот слот уже занят");
  });

  it("shows the Moscow time note in the confirmation card without changing the time", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("heading", { name: "Встреча 15 минут" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /09:00/ }));

    const confirmationCard = getCardByTitle("Подтвердите запись");
    expect(within(confirmationCard).getByText(timeZoneNote)).toBeInTheDocument();
    expect(within(confirmationCard).getByText(/15 ноября.*09:00/)).toBeInTheDocument();
    expect(within(confirmationCard).getByText(/15 минут/)).toBeInTheDocument();
  });

  it("shows the Moscow time note on the success screen without changing the time", async () => {
    apiMocks.createBooking.mockResolvedValueOnce({
      data: {
        id: "booking-1",
        meetingTypeId: "intro-15",
        meetingType: {
          id: "intro-15",
          title: "Встреча 15 минут",
          description: "Короткий звонок",
          durationMinutes: 15,
        },
        start: "2026-11-15T06:00:00.000Z",
        end: "2026-11-15T06:15:00.000Z",
        guestName: "Анна",
        guestEmail: "anna@example.com",
        createdAt: "2026-11-14T00:00:00.000Z",
      },
      error: undefined,
      response: { status: 201 },
    });

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("heading", { name: "Встреча 15 минут" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /09:00/ }));
    await user.type(screen.getByRole("textbox", { name: "Имя" }), "Анна");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "anna@example.com");
    await user.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByText("Вы записаны")).toBeInTheDocument();

    const successCard = getCardByTitle("Вы записаны");
    expect(within(successCard).getByText(timeZoneNote)).toBeInTheDocument();
    expect(within(successCard).getByText(/15 ноября.*09:00/)).toBeInTheDocument();
  });
});
