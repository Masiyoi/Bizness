$ErrorActionPreference = "Stop"

function Replace-LinesBetween {
    param($Path, $StartMatch, $EndMatch, [string[]]$NewLines, $Label)

    if (-not (Test-Path $Path)) {
        Write-Host "SKIPPED [$Label]: file not found at '$Path'" -ForegroundColor Red
        return
    }

    $raw = Get-Content -Raw -LiteralPath $Path
    $isCRLF = $raw -match "`r`n"
    $lines = Get-Content -LiteralPath $Path

    $startIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -like $StartMatch) { $startIdx = $i; break }
    }
    if ($startIdx -eq -1) {
        Write-Host "SKIPPED [$Label]: start anchor not found in '$Path'" -ForegroundColor Red
        return
    }

    $endIdx = -1
    for ($i = $startIdx + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq $EndMatch) { $endIdx = $i; break }
    }
    if ($endIdx -eq -1) {
        Write-Host "SKIPPED [$Label]: end anchor not found after line $($startIdx+1) in '$Path'" -ForegroundColor Red
        return
    }

    Copy-Item -LiteralPath $Path -Destination "$Path.bak" -Force

    $before = $lines[0..($startIdx - 1)]
    $after  = $lines[($endIdx + 1)..($lines.Count - 1)]
    $result = $before + $NewLines + $after

    $eol = if ($isCRLF) { "`r`n" } else { "`n" }
    $finalText = ($result -join $eol) + $eol
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText((Resolve-Path $Path), $finalText, $utf8NoBom)

    Write-Host "APPLIED [$Label] -> $Path  (lines $($startIdx+1)-$($endIdx+1) replaced, backup at $Path.bak)" -ForegroundColor Green
}

# ── Fix 1: membersController.js — awardOrderPoints ─────────────────────────
$membersPath = "Server\controllers\membersController.js"
$newAwardOrderPoints = @(
'async function awardOrderPoints(userId, orderTotal) {',
'  try {',
'    const { rows: [{ count }] } = await pool.query(',
'      "SELECT COUNT(*)::int AS count FROM orders WHERE user_id = $1 AND status = ''confirmed''",',
'      [userId]',
'    );',
'    const isFirstOrder = Number(count) === 1;',
'',
'    // Referral bonus fires on the referred user''s first order regardless',
'    // of whether THEY are a club member.',
'    if (isFirstOrder) {',
'      await awardReferralBonus(userId);',
'    }',
'',
'    const { rows: [member] } = await pool.query(',
'      ''SELECT id, club_joined FROM members WHERE user_id = $1'',',
'      [userId]',
'    );',
'    if (!member || !member.club_joined) return;',
'',
'    const spendPoints = Math.floor(Number(orderTotal) / 100) * SPEND_POINTS_PER_KSH100;',
'    if (spendPoints > 0) {',
'      await addPoints(member.id, spendPoints, `Order purchase - KSh ${orderTotal}`);',
'    }',
'    if (isFirstOrder) {',
'      await addPoints(member.id, FIRST_ORDER_BONUS, ''First order bonus'');',
'    }',
'  } catch (err) {',
'    console.error(''awardOrderPoints error:'', err.message);',
'  }',
'}'
)
Replace-LinesBetween -Path $membersPath -StartMatch "async function awardOrderPoints*" -EndMatch "}" -NewLines $newAwardOrderPoints -Label "membersController.js: awardOrderPoints"

# ── Fix 2: authController.js — googleAuth ───────────────────────────────────
$authPath = "Server\controllers\authController.js"
$newGoogleAuth = @(
'exports.googleAuth = async (req, res) => {',
'  const { credential, referral_code } = req.body;',
'  if (!credential) return res.status(400).json({ msg: ''Google credential is required.'' });',
'  try {',
'    const ticket = await googleClient.verifyIdToken({',
'      idToken:  credential,',
'      audience: process.env.GOOGLE_CLIENT_ID,',
'    });',
'    const payload = ticket.getPayload();',
'    if (payload.aud !== process.env.GOOGLE_CLIENT_ID)',
'      return res.status(401).json({ msg: ''Invalid Google token audience.'' });',
'    const { sub: google_id, email, name: full_name, picture } = payload;',
'    let result = await db.query(',
'      ''SELECT * FROM users WHERE google_id = $1 OR email = $2'',',
'      [google_id, email.toLowerCase()]',
'    );',
'    let user;',
'    if (result.rows.length > 0) {',
'      user = result.rows[0];',
'      if (!user.google_id) {',
'        await db.query(''UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2'', [google_id, user.id]);',
'        user.google_id = google_id; user.is_verified = true;',
'      }',
'    } else {',
'      let referredBy = null;',
'      if (referral_code && typeof referral_code === ''string'') {',
'        const { rows: [referrer] } = await db.query(',
'          ''SELECT id FROM users WHERE referral_code = $1'',',
'          [referral_code.trim().toUpperCase()]',
'        );',
'        if (referrer) referredBy = referrer.id;',
'      }',
'      const ownReferralCode = await generateReferralCode();',
'      const newUser = await db.query(',
'        `INSERT INTO users (full_name, email, google_id, is_verified, profile_picture, referral_code, referred_by)',
'         VALUES ($1, $2, $3, TRUE, $4, $5, $6) RETURNING id, full_name, email, is_verified, role, profile_picture`,',
'        [full_name, email.toLowerCase(), google_id, picture, ownReferralCode, referredBy]',
'      );',
'      user = newUser.rows[0];',
'      try {',
'        await registerMember(user.id);',
'      } catch (memberErr) {',
'        console.error(''registerMember error (googleAuth):'', memberErr.message);',
'      }',
'    }',
'    const token = generateToken(user.id, user.role);',
'    res.cookie(''token'', token, { httpOnly:true, secure:true, sameSite:''none'', domain:''.lukuprime.shop'', maxAge:7*24*60*60*1000 });',
'    return res.json({ token, user: { id:user.id, full_name:user.full_name, email:user.email, is_verified:user.is_verified, role:user.role, profile_picture:user.profile_picture } });',
'  } catch (err) {',
'    console.error(''Google auth error:'', err.message);',
'    return res.status(401).json({ msg: ''Google authentication failed.'' });',
'  }',
'};'
)
Replace-LinesBetween -Path $authPath -StartMatch "exports.googleAuth = async*" -EndMatch "};" -NewLines $newGoogleAuth -Label "authController.js: googleAuth"

# ── Fix 3: Register.tsx — handleGoogleResponse ──────────────────────────────
$registerPath = "frontend\src\pages\Register.tsx"
$newHandleGoogleResponse = @(
'  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {',
'    setGoogleLoading(true); setServerError("");',
'    try {',
'      const res = await axios.post("/api/auth/google", {',
'        credential: response.credential,',
'        referral_code: referralCode,',
'      }, {',
'        withCredentials: true,',
'      });',
'      localStorage.setItem("user", JSON.stringify(res.data.user));',
'      navigate("/");',
'    } catch (err: any) {',
'      setServerError(err.response?.data?.msg || "Google sign-in failed.");',
'    } finally { setGoogleLoading(false); }',
'  }, [navigate, referralCode]);'
)
Replace-LinesBetween -Path $registerPath -StartMatch "*const handleGoogleResponse = useCallback*" -EndMatch "}, [navigate]);" -NewLines $newHandleGoogleResponse -Label "Register.tsx: handleGoogleResponse"

# ── Syntax check the two backend files if node is available ────────────────
Write-Host "`n--- Syntax check ---" -ForegroundColor Cyan
foreach ($f in @($membersPath, $authPath)) {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $check = & node --check $f 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: $f" -ForegroundColor Green
        } else {
            Write-Host "SYNTAX ERROR in $f :" -ForegroundColor Red
            Write-Host $check
        }
    } else {
       Write-Host "node not found on PATH - skipping syntax check for $f. Run node --check manually." -ForegroundColor Yellow    }
}

Write-Host "`nDone. Review changes with:" -ForegroundColor Cyan
Write-Host "  git diff -- $membersPath"
Write-Host "  git diff -- $authPath"
Write-Host "  git diff -- $registerPath"