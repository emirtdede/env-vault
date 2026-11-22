# winget manifests

Manifests for publishing Env Vault to the Windows Package Manager community
repository.

## Validate locally

```powershell
winget validate --manifest packaging/winget
```

## Submit

1. Compute the SHA256 of the release installer.
2. Put the value in `Vellium.EnvVault.installer.yaml`.
3. Fork `microsoft/winget-pkgs`.
4. Copy the three YAML files to
   `manifests/v/Vellium/EnvVault/1.0.0/`.
5. Run `winget validate` on the copied folder.
6. Open a pull request against `microsoft/winget-pkgs`.

The release installer is published as
`Env-Vault_1.0.0_x64-setup.exe` so the URL contains no spaces.
