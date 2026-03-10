import { NextResponse } from 'next/server';

// 设置响应为流式输出（必须）
export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 模拟AI回复（先测试用，后续再接入真实API）
        const mockResponse = "这是一个测试回复。第二步成功了！";

        // 创建流式响应（模拟逐字输出）
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                // 模拟逐字输出效果
                for (let i = 0; i < mockResponse.length; i++) {
                    controller.enqueue(encoder.encode(mockResponse[i]));
                    // 模拟延迟，让打字机效果更明显
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'AI服务暂时不可用' },
            { status: 500 }
        );
    }
}