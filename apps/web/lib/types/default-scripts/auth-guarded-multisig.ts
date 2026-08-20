import type { Script } from "@/lib/types/script";
import { defaultProcedureExport, defaultScript } from "@/lib/utils/script";

export const rust = ``;

export const masm = `# Multi-Signature RPO Falcon 512 Authentication Component With GUARDIAN

use openzeppelin::auth::multisig
use openzeppelin::auth::guardian

type BeWord = struct @bigendian { a: felt, b: felt, c: felt, d: felt }

pub use multisig::update_signers_and_threshold
pub use multisig::update_procedure_threshold
pub use guardian::update_guardian_public_key
pub use guardian::verify_guardian_signature

pub proc auth_tx_multisig_guardian(salt: BeWord)
    exec.multisig::auth_tx
    exec.guardian::verify_guardian_signature
    exec.multisig::assert_new_tx
end
`;

const authGuardedMultisig: Script = {
  ...defaultScript(),
  id: "auth-guarded-multisig",
  name: "auth-guarded-multisig",
  type: "authentication-component",
  status: "compiled",
  readOnly: true,
  rust,
  masm,
  digest: "0x9cd0bb72bedded46df8ac73ce6bdbf60323ce3bab1e25db0ea3d79b704b4ed2d",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::auth_tx_guarded_multisig",
      digest:
        "0xa6aa6f69d9358535272ba433cd48d20628a5c69598e00c6dd01a22e83a5f15df",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::get_signer_at",
      digest:
        "0xed5cb44442abc305aa5be5244ff419e3e2f202b24eeb795b28d276eb47ee4a58",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::get_threshold_and_num_approvers",
      digest:
        "0x649d27ee055078eec136ffe615e2eae1f7bacab0f1dfe99b64286fdaf0413502",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::is_signer",
      digest:
        "0x39707a132c2af47eebc910f8b9c495dfe4b351dc8f792793c490425b7ba03a16",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::set_procedure_threshold",
      digest:
        "0x97587c61d49313b1d5a3c8b7437e0080e67ed9bd9d3e7206bcae562f934ccd03",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::update_guardian_public_key",
      digest:
        "0x0a614ff7c81a561cbd2a4c2d9482031a7a841ca5de33349daed23a9d871b3675",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::update_signers_and_threshold",
      digest:
        "0xa261cfd3c8791ac5abe1e78e14eade2f20789d73ab1c23c430418de59bc3380e",
    },
  ],
};

export default authGuardedMultisig;
