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
  commitment:
    "0x4ec0dd8bf5ced6e758f661aeebe4f1cc6ea6eecf66b7758968ca953a7e9c1348",
  procedureExports: [
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::auth_tx_guarded_multisig",
      digest:
        "0x71ba7380c6138d5e80e911094a9767ed0fa5c8ffefcf6a776754bfc75bc163b9",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::get_signer_at",
      digest:
        "0xa3dfe78fbde4360b3672d7c706d9e089d7b1fd4095fc3da0c5fa02996d91c037",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::get_threshold_and_num_approvers",
      digest:
        "0xa8b67a43d85279823c2ee823bd5498075a11e78906c834bdaf0e0d5471d43013",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::is_signer",
      digest:
        "0x7ccc1a2ab4eeaf7504540fc0845df07021137ab75778d998c72a46dce3f0b4a3",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::set_procedure_threshold",
      digest:
        "0xa32cd13808fd8fb91adb3dceaed4d8faebc3bd80fa49c2903be4b8d7bf89ba77",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::update_guardian_public_key",
      digest:
        "0x93dedb135fd5bb7112c07aacf4a5680ddc76e45ecf043bfc42ea735b6d971911",
    },
    {
      ...defaultProcedureExport(),
      path: "::miden::standards::components::auth::guarded_multisig::update_signers_and_threshold",
      digest:
        "0x0f664cdaae422fe43bb45d959c7e469b0c855ad1fc4e79fddd730ec3cb983c6e",
    },
  ],
};

export default authGuardedMultisig;
