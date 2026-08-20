# apply_carousel_patch.ps1
# Run from the repo root (e.g. C:\Users\Administrator\bizness)
$path = "frontend/src/pages/Reviews.tsx"

if (-not (Test-Path $path)) {
    Write-Host "Trying alternate path..." -ForegroundColor Yellow
    $path = "src/pages/ReviewPage.tsx"
}

if (-not (Test-Path $path)) {
    Write-Host "X File not found. Adjust `$path at the top of this script." -ForegroundColor Red
    exit 1
}

Copy-Item $path "$path.bak" -Force
Write-Host "[OK] Backup created: $path.bak"

$raw = [System.IO.File]::ReadAllText($path)
$content = $raw -replace "`r`n", "`n"
$patchCount = 0

function Try-Patch($content, $old, $new, $label) {
    $oldNorm = $old -replace "`r`n", "`n"
    $newNorm = $new -replace "`r`n", "`n"
    if ($content.Contains($oldNorm)) {
        Write-Host "[OK] Patched: $label"
        return @{ content = $content.Replace($oldNorm, $newNorm); success = $true }
    } else {
        Write-Host "X pattern not found: $label" -ForegroundColor Yellow
        return @{ content = $content; success = $false }
    }
}

# ── Patch 1: add useRef to the React import ──────────────────
$old1 = "import { useEffect, useState, useCallback } from 'react';"
$new1 = "import { useEffect, useState, useCallback, useRef } from 'react';"
$result = Try-Patch $content $old1 $new1 "React import (add useRef)"
$content = $result.content; if ($result.success) { $patchCount++ }

# ── Patch 2: insert the MediaCarousel component ───────────────
$old2 = "export default function ReviewPage() {"

$new2 = @'
// ── Media carousel: one frame, swipeable on mobile, arrows on desktop ──
function MediaCarousel({ media }: { media: ReviewMedia[] }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (!media || media.length === 0) return null;

  const scrollToIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(i, media.length - 1));
    setIndex(clamped);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div className="media-carousel" style={{ marginTop:12, position:'relative', width:'100%', maxWidth:300 }}>
      <div ref={trackRef} onScroll={handleScroll} className="media-carousel-track"
        style={{ display:'flex', overflowX:'auto', scrollSnapType:'x mandatory', borderRadius:10, border:'1.5px solid #E0E0E0', background:'#F5F5F5' }}>
        {media.map((m, i) => (
          <div key={i} style={{ flex:'0 0 100%', scrollSnapAlign:'start', position:'relative', aspectRatio:'4 / 3', width:'100%' }}>
            {m.media_type === 'video'
              ? <video src={m.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} muted controls playsInline/>
              : <img src={m.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            }
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <>
          <button type="button" className="mc-arrow mc-arrow-left" onClick={() => scrollToIndex(index - 1)} disabled={index === 0}
            style={{ position:'absolute', left:6, top:'calc(50% - 14px)' }}>&#8249;</button>
          <button type="button" className="mc-arrow mc-arrow-right" onClick={() => scrollToIndex(index + 1)} disabled={index === media.length - 1}
            style={{ position:'absolute', right:6, top:'calc(50% - 14px)' }}>&#8250;</button>

          <div className="jost" style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, pointerEvents:'none' }}>
            {index + 1}/{media.length}
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:7 }}>
            {media.map((_, i) => (
              <span key={i} onClick={() => scrollToIndex(i)}
                style={{ width:6, height:6, borderRadius:'50%', background: i === index ? T.gold : '#DDDDDD', cursor:'pointer', transition:'background 0.2s' }}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ReviewPage() {
'@

$result = Try-Patch $content $old2 $new2 "Insert MediaCarousel component"
$content = $result.content; if ($result.success) { $patchCount++ }

# ── Patch 3: replace the stacked-thumbnail media block ────────
$old3 = @'
                          {review.media && review.media.length > 0 && (
                            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ position:'relative', display:'inline-block' }}>
                                {review.media[0].media_type === 'video'
                                  ? <video src={review.media[0].url} style={{ width:48, height:48, objectFit:'cover', borderRadius:6, border:'1.5px solid #E0E0E0' }} muted/>
                                  : <img src={review.media[0].url} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:6, border:'1.5px solid #E0E0E0' }}/>
                                }
                                {review.media[0].media_type === 'video' && (
                                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#FFFFFF', fontSize:18, pointerEvents:'none' }}>▶</div>
                                )}
                                {review.media.length > 1 && (
                                  <div style={{ position:'absolute', top:-4, right:-4, background:T.gold, color:'#FFFFFF', width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, border:'2px solid #FFFFFF' }}>
                                    {review.media.length}
                                  </div>
                                )}
                              </div>
                              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                {review.media.slice(1, 4).map((m, i) => (
                                  <div key={i} style={{ position:'relative', width:40, height:40, borderRadius:4, overflow:'hidden', border:'1px solid #E0E0E0', background:'#F5F5F5' }}>
                                    {m.media_type === 'video'
                                      ? <video src={m.url} style={{ width:'100%', height:'100%', objectFit:'cover' }} muted/>
                                      : <img src={m.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                                    }
                                    {m.media_type === 'video' && (
                                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#FFFFFF', fontSize:10, pointerEvents:'none', background:'rgba(0,0,0,0.3)' }}>▶</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
'@

$new3 = "                          <MediaCarousel media={review.media || []} />`n"

$result = Try-Patch $content $old3 $new3 "Replace stacked media block with MediaCarousel"
$content = $result.content; if ($result.success) { $patchCount++ }

# ── Patch 4: add carousel CSS (arrows, scrollbar hiding) ──────
$old4 = "  @media(max-width:600px){"
$new4 = @'
  .media-carousel-track{scroll-behavior:smooth}
  .media-carousel-track::-webkit-scrollbar{display:none}
  .media-carousel-track{scrollbar-width:none}
  .mc-arrow{width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,0.55);color:#fff;font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s,background 0.2s}
  .media-carousel:hover .mc-arrow{opacity:1}
  .mc-arrow:hover{background:rgba(0,0,0,0.8)}
  .mc-arrow:disabled{opacity:0!important;pointer-events:none}
  @media(max-width:600px){
    .mc-arrow{display:none}
    .media-carousel{max-width:100%!important}
'@

$result = Try-Patch $content $old4 $new4 "Add carousel CSS"
$content = $result.content; if ($result.success) { $patchCount++ }

$finalContent = $content -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($path, $finalContent, [System.Text.UTF8Encoding]::new($true))
Write-Host ""
Write-Host "Done. $patchCount of 4 patches applied. Saved: $path" -ForegroundColor Cyan