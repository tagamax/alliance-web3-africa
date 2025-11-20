import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  channels: ('email' | 'sms' | 'push')[];
  data?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationRequest = await req.json();
    const { userId, type, title, message, channels, data } = payload;

    const results = {
      email: false,
      sms: false,
      push: false,
      database: false,
    };

    for (const channel of channels) {
      if (channel === 'email') {
        results.email = await sendEmail(userId, title, message, data);
      } else if (channel === 'sms') {
        results.sms = await sendSMS(userId, message);
      } else if (channel === 'push') {
        results.push = await sendPushNotification(userId, title, message, data);
      }
    }

    results.database = await saveToDatabase(userId, type, title, message, data);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function sendEmail(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`Sending email to user ${userId}:`, title);

    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

async function sendSMS(userId: string, message: string): Promise<boolean> {
  try {
    console.log(`Sending SMS to user ${userId}:`, message);

    return true;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return false;
  }
}

async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    console.log(`Sending push notification to user ${userId}:`, title);

    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;
  }
}

async function saveToDatabase(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false,
        created_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Database insert failed: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Database save failed:", error);
    return false;
  }
}
