; Inno Setup Script for Persian Archive & OCR Desktop Suite (سندبان)
; Compiler: Inno Setup 6.2+
; Architecture: Windows x64
; Product: ArchiveOCR / سامانه بایگانی و نویسه‌خوان اسناد فارسی سندبان

#define MyAppName "سامانه بایگانی و نویسه‌خوان اسناد فارسی سندبان"
#define MyAppNameShort "سندبان Archive OCR"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "توسعه‌دهندگان نرم‌افزار سندبان"
#define MyAppExeName "ArchiveOCR.exe"
#define MyAppId "{{5E97D4B6-28D1-49AE-9DCE-9FA354BFB2E9}"

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName=سندبان نگارش ۱.۰.۰
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\ArchiveOCR
DefaultGroupName=سامانه آرشیو و نویسه‌خوان فارسی
DisableProgramGroupPage=yes
LicenseFile=..\LICENSE_FA.txt
InfoBeforeFile=..\installer\welcome-fa.txt
OutputDir=..\Output
OutputBaseFilename=ArchiveOCR_Setup_v1.0.1
SetupIconFile=..\build\app_icon.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma
SolidCompression=no
LZMAUseSeparateProcess=yes
WizardStyle=modern
; Note: ultra64 solid compression OOM'd under Wine; Windows hosts may set lzma2/ultra64
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
DisableWelcomePage=no
WizardSizePercent=120
ShowLanguageDialog=no
DirExistsWarning=no
CloseApplications=force
RestartIfNeededByRun=no

[Languages]
Name: "persian"; MessagesFile: "Persian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Types]
Name: "full"; Description: "نصب کامل (هسته + OCR فارسی + پل اسکنر)"
Name: "custom"; Description: "نصب سفارشی"; Flags: iscustom

[Components]
Name: "core"; Description: "هسته اصلی سامانه بایگانی و پایگاه داده محلی SQLite"; Types: full custom; Flags: fixed
Name: "ocr"; Description: "مدل‌های Tesseract OCR v5 (فارسی fas / fas_best)"; Types: full custom
Name: "scanner"; Description: "پل سخت‌افزاری اسکنر (TWAIN/WIA placeholder)"; Types: full custom
Name: "shortcuts"; Description: "میانبر دسکتاپ و منوی شروع"; Types: full custom

[Tasks]
Name: "desktopicon"; Description: "ایجاد میانبر روی میزکار"; GroupDescription: "میانبرها:"; Components: shortcuts; Flags: checkedonce
Name: "repoinit"; Description: "ایجاد پوشه مخزن اسناد محلی"; GroupDescription: "مخزن:"; Flags: checkedonce

[Dirs]
Name: "{app}\db"
Name: "{app}\tessdata"; Components: ocr
Name: "{app}\drivers"; Components: scanner
Name: "{app}\repository"; Tasks: repoinit
Name: "{commonappdata}\ArchiveOCR\repository"; Tasks: repoinit

[Files]
; Electron win-unpacked bundle produced by electron-builder / pack-offline
Source: "..\dist-electron\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: core
; Persian Tesseract OCR Training Assets (also duplicated under resources by electron-builder)
Source: "..\ocr_models\fas\fas.traineddata"; DestDir: "{app}\tessdata"; Flags: ignoreversion; Components: ocr
Source: "..\ocr_models\fas\fas_best.traineddata"; DestDir: "{app}\tessdata"; Flags: ignoreversion skipifsourcedoesntexist; Components: ocr
; Scanner bridge placeholder (real TWAIN DLL supplied on hardware-certified builds)
Source: "..\resources\drivers\*"; DestDir: "{app}\drivers"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Components: scanner
; VC++ redistributable (optional; skip if not vendored)
Source: "..\redist\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall skipifsourcedoesntexist; Components: core

[Icons]
Name: "{group}\{#MyAppNameShort}"; Filename: "{app}\{#MyAppExeName}"; Components: core
Name: "{group}\حذف نصب سندبان"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppNameShort}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKLM; Subkey: "Software\Sandban\ArchiveOCR"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Sandban\ArchiveOCR"; ValueType: string; ValueName: "Tessdata"; ValueData: "{app}\tessdata"
Root: HKLM; Subkey: "Software\Sandban\ArchiveOCR"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"

[Run]
Filename: "{tmp}\vc_redist.x64.exe"; Parameters: "/quiet /install /norestart"; StatusMsg: "در حال نصب پیش‌نیازهای سیستمی ویندوز (VC++ )..."; Flags: runhidden skipifdoesntexist; Components: core
Filename: "{app}\{#MyAppExeName}"; Description: "اجرای سندبان پس از نصب"; Flags: nowait postinstall skipifsilent; Components: core

[UninstallDelete]
Type: filesandordirs; Name: "{app}\db"
Type: filesandordirs; Name: "{app}\tessdata"

[Code]
var
  RepoPage: TInputDirWizardPage;
  OcrPage: TWizardPage;
  OcrCheck: TNewCheckBox;
  ScannerCheck: TNewCheckBox;

procedure InitializeWizard;
begin
  WizardForm.WelcomeLabel1.Caption := 'به نصب سندبان خوش آمدید';
  WizardForm.WelcomeLabel2.Caption :=
    'سامانه بایگانی و نویسه‌خوان اسناد فارسی (Archive OCR) به‌صورت کاملاً آفلاین روی این رایانه نصب می‌شود.' + #13#10 + #13#10 +
    'مراحل: خوش‌آمدگویی ← مجوز ← مسیر نصب و مخزن ← اجزای OCR/اسکنر ← پیشرفت و اتمام.';

  RepoPage := CreateInputDirPage(
    wpSelectDir,
    'مسیر مخزن اسناد محلی',
    'پوشه نگهداری فایل‌های اسکن‌شده و پایگاه جانبی را مشخص کنید.',
    'مسیر مخزن (Repository) جدا از مسیر نصب برنامه است و می‌تواند روی دیسک داده قرار گیرد.',
    False,
    '');
  RepoPage.Add('مسیر مخزن اسناد:');
  RepoPage.Values[0] := ExpandConstant('{commonappdata}\ArchiveOCR\repository');

  OcrPage := CreateCustomPage(
    RepoPage.ID,
    'اجزای اسکنر و OCR',
    'ماژول‌های آفلاین مورد نیاز ایستگاه کاری را انتخاب کنید.');

  OcrCheck := TNewCheckBox.Create(OcrPage);
  OcrCheck.Parent := OcrPage.Surface;
  OcrCheck.Left := ScaleX(8);
  OcrCheck.Top := ScaleY(16);
  OcrCheck.Width := OcrPage.SurfaceWidth - ScaleX(16);
  OcrCheck.Caption := 'نصب مدل فارسی Tesseract (fas.traineddata) — پیشنهادی';
  OcrCheck.Checked := True;

  ScannerCheck := TNewCheckBox.Create(OcrPage);
  ScannerCheck.Parent := OcrPage.Surface;
  ScannerCheck.Left := ScaleX(8);
  ScannerCheck.Top := ScaleY(48);
  ScannerCheck.Width := OcrPage.SurfaceWidth - ScaleX(16);
  ScannerCheck.Caption := 'نصب پل درایور اسکنر TWAIN/WIA';
  ScannerCheck.Checked := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = OcrPage.ID then
  begin
    if OcrCheck.Checked then
      WizardSelectComponents('ocr')
    else
      WizardSelectComponents('!ocr');
    if ScannerCheck.Checked then
      WizardSelectComponents('scanner')
    else
      WizardSelectComponents('!scanner');
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  RepoPath: String;
begin
  if CurStep = ssPostInstall then
  begin
    RepoPath := RepoPage.Values[0];
    if RepoPath <> '' then
      ForceDirectories(RepoPath);
    SaveStringToFile(
      ExpandConstant('{app}\repository.path.txt'),
      RepoPath,
      False);
  end;
end;
