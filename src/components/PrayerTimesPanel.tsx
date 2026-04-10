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
      width: '100%',
      flexShrink: 0,
      background: '#fff',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '10px 20px',
      gap: '8px',
    }}>
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px',
        marginLeft: '16px',
      }}>
        <div style={{ width: '4px', height: '20px', borderRadius: '4px', background: '#891738' }} />
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#891738', whiteSpace: 'nowrap' }}>זמני תפילות</span>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
        gap: '6px 16px', alignItems: 'center', justifyContent: 'center',
      }}>
        {prayerTimes.map(function(pt, i) {
          return (
            <div key={pt.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '8px',
              background: i % 2 === 0 ? 'rgba(137,23,56,0.04)' : 'transparent',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 500, color: '#444', whiteSpace: 'nowrap' }}>
                {pt.name}
                {pt.notes && (
                  <span style={{ fontSize: '12px', color: '#999', marginRight: '6px' }}> ({pt.notes})</span>
                )}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#891738', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{pt.time}</span>
            </div>
          )
        })}

        {prayerTimes.length === 0 && (
          <p style={{ fontSize: '14px', color: '#bbb', textAlign: 'center', padding: '4px 0' }}>
            אין זמני תפילות להיום
          </p>
        )}
      </div>
    </div>
  )
}
