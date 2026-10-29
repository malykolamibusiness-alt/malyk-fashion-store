"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/server";

export type AddressActionState = { error?: string; success?: string };

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40),
  country: z.string().trim().min(2).max(80),
  addressLine1: z.string().trim().min(1).max(240),
  addressLine2: z.string().trim().max(240),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120),
  postalCode: z.string().trim().max(32),
  isDefault: z.boolean(),
});

export async function saveAddressAction(_previous: AddressActionState, formData: FormData): Promise<AddressActionState> {
  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") ?? "",
    country: formData.get("country"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") ?? "",
    city: formData.get("city"),
    state: formData.get("state") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your address." };

  const { supabase, user } = await requireUser("/account/addresses");
  const id = String(formData.get("id") ?? "");
  const values = {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    country: parsed.data.country,
    address_line1: parsed.data.addressLine1,
    address_line2: parsed.data.addressLine2,
    city: parsed.data.city,
    state: parsed.data.state,
    postal_code: parsed.data.postalCode,
    is_default: parsed.data.isDefault,
    user_id: user.id,
  };
  const result = id
    ? await supabase.from("customer_addresses").update({
        full_name: values.full_name,
        phone: values.phone,
        country: values.country,
        address_line1: values.address_line1,
        address_line2: values.address_line2,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        is_default: values.is_default,
      }).eq("id", id).eq("user_id", user.id)
    : await supabase.from("customer_addresses").insert(values);
  if (result.error) {
    console.error("MALYK address save failed.");
    return { error: "The address could not be saved." };
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: "Address saved." };
}

export async function setDefaultAddressAction(addressId: string) {
  const { supabase, user } = await requireUser("/account/addresses");
  if (!z.uuid().safeParse(addressId).success) throw new Error("Invalid address.");
  const { error } = await supabase.from("customer_addresses").update({ is_default: true }).eq("id", addressId).eq("user_id", user.id);
  if (error) throw new Error("The default address could not be changed.");
  revalidatePath("/account/addresses");
}

export async function deleteAddressAction(addressId: string) {
  const { supabase, user } = await requireUser("/account/addresses");
  if (!z.uuid().safeParse(addressId).success) throw new Error("Invalid address.");
  const { error } = await supabase.from("customer_addresses").delete().eq("id", addressId).eq("user_id", user.id);
  if (error) throw new Error("The address could not be deleted.");
  revalidatePath("/account/addresses");
}
