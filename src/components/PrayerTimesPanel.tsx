'use client'

import type { PrayerTime } from '@/lib/types'

interface Props {
  prayerTimes: PrayerTime[]
}

// Prayer times are already filtered and resolved on the server.
// This component just displays them.
export default function PrayerTimesPanel({ prayerTimes }: Props) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{
        flexShrink: 0, padding: '16px 20px 8px 20px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{ width: '4px', height: '20px', borderRadius: '4px', background: '#891738' }} />
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#891738' }}>זמני תפילות</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px 16px', minHeight: 0 }}>
        {prayerTimes.map(function(pt, i) {
          return (
            <div key={pt.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: '4px', borderRadius: '8px',
              background: i % 2 === 0 ? 'rgba(137,23,56,0.04)' : 'transparent',
            }}>
              <div>
                <span style={{ fontSize: '17px', fontWeight: 500, color: '#444' }}>{pt.name}</span>
                {pt.notes && (
                  <span style={{ fontSize: '13px', color: '#999', marginRight: '8px' }}> ({pt.notes})</span>
                )}
              </div>
              <span style={{ fontSize: '21px', fontWeight: 'bold', color: '#891738', fontVariantNumeric: 'tabular-nums' }}>{pt.time}</span>
            </div>
          )
        })}

        {prayerTimes.length === 0 && (
          <p style={{ fontSize: '14px', color: '#bbb', textAlign: 'center', padding: '16px 0' }}>
            אין זמני תפילות להיום
          </p>
        )}
      </div>
    </div>
  )
}
