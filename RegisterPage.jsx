import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./config"; // Path diperbaiki untuk menunjuk ke file config.ts di root
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Ini adalah placeholder untuk komponen UI dari Shadcn.
// Anda harus menginstalnya menggunakan `npx shadcn-ui@latest add ...`
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { useToast } from "@/components/ui/use-toast";

// Skema validasi yang sangat detail menggunakan Zod
const registerSchema = z.object({
    fullName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
    phone: z.string().min(10, { message: "Nomor HP tidak valid." }).regex(/^(08|\+62)/, { message: "Harus diawali 08 atau +62." }),
    email: z.string().email({ message: "Format email tidak valid." }),
    password: z.string()
        .min(8, { message: "Password minimal 8 karakter." })
        .regex(/[A-Z]/, { message: "Harus ada 1 huruf besar." })
        .regex(/[a-z]/, { message: "Harus ada 1 huruf kecil." })
        .regex(/[0-9]/, { message: "Harus ada 1 angka." })
        .regex(/[^A-Za-z0-9]/, { message: "Harus ada 1 karakter khusus." }),
    confirmPassword: z.string(),
    province: z.string().min(1, { message: "Provinsi wajib diisi." }),
    city: z.string().min(1, { message: "Kabupaten/Kota wajib diisi." }),
    district: z.string().min(1, { message: "Kecamatan wajib diisi." }),
    village: z.string().min(1, { message: "Kelurahan/Desa wajib diisi." }),
    fullAddress: z.string().min(10, { message: "Alamat lengkap minimal 10 karakter." }),
    postalCode: z.string().min(5, { message: "Kode pos tidak valid." }),
    terms: z.boolean().refine(val => val === true, { message: "Anda harus menyetujui Syarat & Ketentuan." }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
});

/**
 * Fungsi untuk membuat dokumen pengguna di Firestore.
 * Dapat digunakan kembali untuk registrasi email dan registrasi via Google.
 * @param {object} user - Objek pengguna dari Firebase Auth.
 * @param {object} additionalData - Data tambahan dari form atau profil Google.
 */
export const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);

    const userData = {
        uid: user.uid,
        email: user.email,
        fullName: additionalData.fullName || user.displayName || "Pengguna Baru",
        phone: additionalData.phone || user.phoneNumber || "",
        address: additionalData.address || {},
        role: "user",
        status: "active",
        createdAt: new Date(),
        // Data lain seperti memberId, qrCode, dll akan ditambahkan oleh Cloud Function
    };

    await setDoc(userRef, userData);
};

export function RegisterPage() {
    const navigate = useNavigate();
    // const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "", phone: "", email: "", password: "", confirmPassword: "",
            province: "", city: "", district: "", village: "", fullAddress: "", postalCode: "",
            terms: false,
        },
    });

    const onSubmit = async (values) => {
        try {
            // 1. Buat user di Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;

            // 2. Gunakan fungsi createUserDocument untuk menyimpan data ke Firestore
            await createUserDocument(user, values);

            // toast({ title: "Registrasi Berhasil", description: "Silakan login untuk melanjutkan." });
            alert("Registrasi Berhasil! Silakan login.");
            navigate("/login");

        } catch (error) {
            // toast({ variant: "destructive", title: "Registrasi Gagal", description: error.message });
            alert(`Registrasi Gagal: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-8">
            {/* Placeholder untuk Form, karena komponennya belum diimpor dengan benar */}
            <h1 className="text-3xl font-bold mb-6 text-center">Daftar Akun Baru</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
                    {/* Semua field form di sini */}
                    <FormField name="fullName" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Lengkap</FormLabel>
                            <FormControl><Input placeholder="Budi Santoso" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name="email" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name="phone" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nomor HP</FormLabel>
                            <FormControl><Input placeholder="081234567890" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name="password" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField name="confirmPassword" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Konfirmasi Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    {/* Tambahkan field alamat lainnya di sini (province, city, dst.) */}

                    <FormField name="terms" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                {/* <Checkbox checked={field.value} onCheckedChange={field.onChange} /> */}
                                <input type="checkbox" checked={field.value} onChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Saya menyetujui Syarat & Ketentuan yang berlaku.</FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )} />

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Mendaftar..." : "Daftar"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}