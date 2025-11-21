import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    patterns: [
      {
        key: 'pattern:route:miami-cayman-cyprus',
        type: 'route',
        confidence: 0.89,
        success_rate: 0.92,
        detection_count: 7,
        last_seen: '2024-01-20T10:30:00Z',
      },
      {
        key: 'pattern:structuring:threshold',
        type: 'structuring',
        confidence: 0.85,
        success_rate: 0.88,
        detection_count: 15,
        last_seen: '2024-01-20T14:15:00Z',
      },
      {
        key: 'pattern:entity:shell_corp',
        type: 'entity',
        confidence: 0.78,
        success_rate: 0.82,
        detection_count: 3,
        last_seen: '2024-01-19T16:45:00Z',
      },
    ],
  })
}

