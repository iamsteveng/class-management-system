import { normalizeToE164 } from "./phone";

/**
 * Rules for what a Customer enters when booking, shared by the apply form (to show
 * errors as they type) and the backend (which never trusts the form).
 */

export const RIDING_EXPERIENCE = ["never", "training_wheels", "short_distance"] as const;
export type RidingExperience = (typeof RIDING_EXPERIENCE)[number];

export const HEIGHT_MIN_CM = 80;
export const HEIGHT_MAX_CM = 220;
export const HEALTH_NOTES_MAX = 500;
export const NAME_MAX = 100;
/** Adults must give someone other than themselves as their emergency contact. */
export const ADULT_AGE = 18;

export type ParticipantInput = {
  name: string;
  age: number;
  height: number;
  riding_experience: RidingExperience;
  mobile: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  health_notes?: string;
  photo_consent: boolean;
};

export type CheckoutErrorCode =
  | "customer_mobile"
  | "name"
  | "age"
  | "age_range"
  | "height"
  | "riding_experience"
  | "mobile"
  | "emergency_contact_name"
  | "emergency_contact_phone"
  | "emergency_contact_self"
  | "health_notes";

export type CheckoutError = {
  /** Which Participant (0-based); absent for errors about the Customer. */
  index?: number;
  code: CheckoutErrorCode;
  message: string;
};

export type AgeRange = { age_min?: number; age_max?: number };

export function validateParticipant(
  p: ParticipantInput,
  index: number,
  ageRange: AgeRange
): CheckoutError[] {
  const errors: CheckoutError[] = [];
  const add = (code: CheckoutErrorCode, message: string) => errors.push({ index, code, message });

  const name = p.name.trim();
  if (!name || name.length > NAME_MAX) add("name", "Please enter the participant's name.");

  if (!Number.isInteger(p.age) || p.age < 1 || p.age > 120) {
    add("age", "Please enter the participant's age.");
  } else if (
    (ageRange.age_min !== undefined && p.age < ageRange.age_min) ||
    (ageRange.age_max !== undefined && p.age > ageRange.age_max)
  ) {
    add("age_range", `This class is for ages ${ageRange.age_min ?? ""}–${ageRange.age_max ?? ""}.`);
  }

  if (!Number.isInteger(p.height) || p.height < HEIGHT_MIN_CM || p.height > HEIGHT_MAX_CM) {
    add("height", "Please enter the participant's height in cm.");
  }

  if (!RIDING_EXPERIENCE.includes(p.riding_experience)) {
    add("riding_experience", "Please choose the participant's riding experience.");
  }

  const mobile = normalizeToE164(p.mobile);
  if (!mobile) add("mobile", "Please enter a valid mobile number.");

  if (!p.emergency_contact_name.trim() || p.emergency_contact_name.trim().length > NAME_MAX) {
    add("emergency_contact_name", "Please enter an emergency contact.");
  }
  const emergencyPhone = normalizeToE164(p.emergency_contact_phone);
  if (!emergencyPhone) {
    add("emergency_contact_phone", "Please enter the emergency contact's phone number.");
  } else if (mobile && emergencyPhone === mobile && Number.isInteger(p.age) && p.age >= ADULT_AGE) {
    add("emergency_contact_self", "The emergency contact must be someone other than the participant.");
  }

  if ((p.health_notes ?? "").length > HEALTH_NOTES_MAX) {
    add("health_notes", `Please keep health notes under ${HEALTH_NOTES_MAX} characters.`);
  }

  return errors;
}

export function validateCheckout(
  customerMobile: string,
  participants: ParticipantInput[],
  ageRange: AgeRange
): CheckoutError[] {
  const errors: CheckoutError[] = [];
  if (!normalizeToE164(customerMobile)) {
    errors.push({ code: "customer_mobile", message: "Please enter a valid WhatsApp mobile number." });
  }
  participants.forEach((p, i) => errors.push(...validateParticipant(p, i, ageRange)));
  return errors;
}

export type PriceInput = {
  airwallex_price?: number;
  airwallex_group_price?: number;
  airwallex_group_min_qty?: number;
  is_free?: boolean;
};

/** The per-Ticket price for an Order of `quantity`: the Group Price once the minimum is reached. */
export function unitPriceFor(cls: PriceInput, quantity: number): number {
  if (cls.is_free) return 0;
  const groupMin = cls.airwallex_group_min_qty ?? 2;
  if (cls.airwallex_group_price && quantity >= groupMin) return cls.airwallex_group_price;
  return cls.airwallex_price ?? 0;
}
