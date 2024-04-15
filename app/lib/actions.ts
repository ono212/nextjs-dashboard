'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  /* CreateInvoice 사용하기 전
  // formData값 추출하기
  const rawFormData = {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  };
  // Test it out:
  console.log(rawFormData);
  */

  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // 센트 단위로 저장하기 위해서
  const amountInCents = amount * 100;

  // YYYY-MM-DD 형식으로 날짜 생성
  const date = new Date().toISOString().split('T')[0];

  // ----------⬆️ validation 끝----------

  // 데이터베이스에 validation한 데이터 삽입
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;

  // 데이터가 바뀌었기 때문에 캐시 삭제 및 서버에 새롭게 요청하기. => revalidatePath함수를 사용하면 됨
  revalidatePath('/dashboard/invoices');

  // 현재 create페이지니까 invoice페이지로 리다이렉션
  redirect('/dashboard/invoices');
}
