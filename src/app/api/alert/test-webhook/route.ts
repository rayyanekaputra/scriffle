import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordAlert, isValidDiscordWebhookUrl } from '@/server/services/discordWebhook';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webhookUrl, channel, template, canvasName, botName, includeMarketStats } = body;

    if (channel !== 'discord') {
      return NextResponse.json(
        { error: 'Testing is currently supported for Discord webhooks' },
        { status: 400 }
      );
    }

    if (!webhookUrl || !isValidDiscordWebhookUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid Discord webhook URL. It should start with https://discord.com/api/webhooks/...' },
        { status: 400 }
      );
    }

    // Realistic test market event for verification
    const testEvent = {
      symbol: 'BBCA',
      price: 10450,
      prevPrice: 9840,
      price_change: 6.2,
      volume: 45200000,
      avg_volume: 28100000,
      timestamp: new Date().toLocaleTimeString(),
    };

    const result = await sendDiscordAlert({
      webhookUrl,
      customMessage: template ? `[Test Ping] ${template}` : '👋 Test ping from your Scriffle canvas!',
      marketEvent: testEvent,
      canvasName: canvasName || 'Active Canvas',
      botName: botName || 'Scriffle Market Bot',
      includeMarketStats: includeMarketStats !== false,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to deliver webhook to Discord' },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test alert delivered to Discord channel successfully!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error while testing webhook' },
      { status: 500 }
    );
  }
}
