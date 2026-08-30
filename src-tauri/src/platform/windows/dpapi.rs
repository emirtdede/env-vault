#![cfg(target_os = "windows")]

use crate::error::{AppError, AppResult};
use std::ffi::c_void;

const CRYPTPROTECT_UI_FORBIDDEN: u32 = 0x1;

#[repr(C)]
struct DataBlob {
    cb_data: u32,
    pb_data: *mut u8,
}

#[link(name = "crypt32")]
#[link(name = "kernel32")]
extern "system" {
    fn CryptProtectData(
        pDataIn: *const DataBlob,
        szDataDescr: *const u16,
        pOptionalEntropy: *const DataBlob,
        pvReserved: *const c_void,
        pPromptStruct: *const c_void,
        dwFlags: u32,
        pDataOut: *mut DataBlob,
    ) -> i32;

    fn CryptUnprotectData(
        pDataIn: *const DataBlob,
        ppszDataDescr: *mut *mut u16,
        pOptionalEntropy: *const DataBlob,
        pvReserved: *const c_void,
        pPromptStruct: *const c_void,
        dwFlags: u32,
        pDataOut: *mut DataBlob,
    ) -> i32;

    fn LocalFree(hmem: *mut c_void) -> *mut c_void;
}

pub fn dpapi_protect(plaintext: &[u8]) -> AppResult<Vec<u8>> {
    let data_in = DataBlob {
        cb_data: plaintext.len() as u32,
        pb_data: plaintext.as_ptr() as *mut u8,
    };
    let mut data_out = DataBlob {
        cb_data: 0,
        pb_data: std::ptr::null_mut(),
    };

    let ret = unsafe {
        CryptProtectData(
            &data_in,
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null(),
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut data_out,
        )
    };

    if ret == 0 {
        return Err(AppError::Crypto("DPAPI şifreleme başarısız oldu.".into()));
    }

    let result = unsafe {
        let slice = std::slice::from_raw_parts(data_out.pb_data, data_out.cb_data as usize);
        let vec = slice.to_vec();
        LocalFree(data_out.pb_data as _);
        vec
    };

    Ok(result)
}

pub fn dpapi_unprotect(ciphertext: &[u8]) -> AppResult<Vec<u8>> {
    let data_in = DataBlob {
        cb_data: ciphertext.len() as u32,
        pb_data: ciphertext.as_ptr() as *mut u8,
    };
    let mut data_out = DataBlob {
        cb_data: 0,
        pb_data: std::ptr::null_mut(),
    };

    let ret = unsafe {
        CryptUnprotectData(
            &data_in,
            std::ptr::null_mut(),
            std::ptr::null(),
            std::ptr::null(),
            std::ptr::null(),
            CRYPTPROTECT_UI_FORBIDDEN,
            &mut data_out,
        )
    };

    if ret == 0 {
        return Err(AppError::Crypto("DPAPI şifre çözme başarısız oldu.".into()));
    }

    let result = unsafe {
        let slice = std::slice::from_raw_parts(data_out.pb_data, data_out.cb_data as usize);
        let vec = slice.to_vec();
        LocalFree(data_out.pb_data as _);
        vec
    };

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dpapi_roundtrip() {
        let sample = b"Windows DPAPI Sensitive Test Secret 12345";
        let encrypted = dpapi_protect(sample).expect("Protect should succeed");
        assert_ne!(encrypted, sample);

        let decrypted = dpapi_unprotect(&encrypted).expect("Unprotect should succeed");
        assert_eq!(decrypted, sample);
    }
}
