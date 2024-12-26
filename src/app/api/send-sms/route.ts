// src/app/api/send-sms/route.ts
import { getLogger } from '@/lib/logger';
import { getCorrelationId } from '@/utils/helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

  const correlationId = getCorrelationId();
  const logger = getLogger().child({ correlationId });
  const { phone, message } = await req.json();

  try {
    const response = await fetch('https://rest-ww.telesign.com/v1/messaging', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic 12345678-9ABC-DEF0-1234-56789ABCDEF0:Uak4fcLTTH/Tv8c/Q6QMwl5t4ck=',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        phone_number: phone,
        message: message,
        account_lifecycle_event: 'create',
        originating_ip: '203.0.113.45',
        external_id: 'CustomExternalID7349',
      }).toString(),
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: data }, { status: 400 });
    }
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}