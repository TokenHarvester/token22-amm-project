use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;


declare_id!("EYzLSaUydn5GLBov2G1ypmL7s3zYqNyNfxY3BQZ7Rdy2");

#[program]
pub mod whitelist_hook {
    use super::*;

    pub fn initialize_whitelist(ctx: Context<InitializeWhitelist>) -> Result<()> {
        let whitelist = &mut ctx.accounts.whitelist;
        whitelist.admin = ctx.accounts.admin.key();
        whitelist.bump = ctx.bumps.whitelist;
        Ok(())
    }

    pub fn add_to_whitelist(
        ctx: Context<ModifyWhitelist>,
        user: Pubkey,
    ) -> Result<()> {
        let whitelist = &mut ctx.accounts.whitelist;
        require!(
            !whitelist.approved_users.contains(&user),
            HookError::UserAlreadyWhitelisted
        );
        whitelist.approved_users.push(user);
        Ok(())
    }

    pub fn remove_from_whitelist(
        ctx: Context<ModifyWhitelist>,
        user: Pubkey,
    ) -> Result<()> {
        let whitelist = &mut ctx.accounts.whitelist;
        whitelist.approved_users.retain(|&x| x != user);
        Ok(())
    }

    /// This is the main transfer hook function called by Token-2022
    pub fn transfer_hook(
        ctx: Context<TransferHook>,
        amount: u64,
    ) -> Result<()> {
        msg!("Transfer hook called with amount: {}", amount);
        
        let whitelist = &ctx.accounts.whitelist;
        
        // Get the owner from the source token account
        let source_token_info = ctx.accounts.source_token.to_account_info();
        let source_token_data = source_token_info.try_borrow_data()?;
        let source_token_account = TokenAccount::try_deserialize(&mut &source_token_data[..])?;
        let source_owner = source_token_account.owner;
        
        // Get the owner from the destination token account
        let dest_token_info = ctx.accounts.destination_token.to_account_info();
        let dest_token_data = dest_token_info.try_borrow_data()?;
        let dest_token_account = TokenAccount::try_deserialize(&mut &dest_token_data[..])?;
        let dest_owner = dest_token_account.owner;

        // Check if at least one party is whitelisted
        let source_whitelisted = whitelist.approved_users.contains(&source_owner);
        let dest_whitelisted = whitelist.approved_users.contains(&dest_owner);
        
        require!(
            source_whitelisted || dest_whitelisted,
            HookError::UserNotWhitelisted
        );

        msg!("Transfer approved: source_whitelisted={}, dest_whitelisted={}", 
             source_whitelisted, dest_whitelisted);

        Ok(())
    }

    /// Initialize extra account meta list (required for transfer hooks)
    pub fn initialize_extra_account_meta_list(
        _ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        // This function is called during mint setup to configure
        // which additional accounts the transfer hook needs
        msg!("Initialized extra account meta list");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeWhitelist<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Whitelist::INIT_SPACE,
        seeds = [b"whitelist"],
        bump
    )]
    pub whitelist: Account<'info, Whitelist>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyWhitelist<'info> {
    #[account(
        mut,
        seeds = [b"whitelist"],
        bump = whitelist.bump,
        has_one = admin
    )]
    pub whitelist: Account<'info, Whitelist>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// CHECK: This account is validated by the token program
    #[account(mut)]
    pub source_token: UncheckedAccount<'info>,
    /// CHECK: This account is validated by the token program
    pub mint: UncheckedAccount<'info>,
    /// CHECK: This account is validated by the token program
    #[account(mut)]
    pub destination_token: UncheckedAccount<'info>,
    /// CHECK: This account is validated by the token program
    pub owner: UncheckedAccount<'info>,
    #[account(seeds = [b"whitelist"], bump = whitelist.bump)]
    pub whitelist: Account<'info, Whitelist>,
    /// CHECK: Extra account required by transfer hook interface
    pub extra_account: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: ExtraAccountMetaList Account, validated by the transfer hook interface
    #[account(mut)]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    /// CHECK: Mint account
    pub mint: UncheckedAccount<'info>,
    /// CHECK: Whitelist account that will be included in transfers
    #[account(seeds = [b"whitelist"], bump)]
    pub whitelist: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Whitelist {
    pub admin: Pubkey,
    #[max_len(1000)]
    pub approved_users: Vec<Pubkey>,
    pub bump: u8,
}

#[error_code]
pub enum HookError {
    #[msg("User not whitelisted")]
    UserNotWhitelisted,
    #[msg("User already whitelisted")]
    UserAlreadyWhitelisted,
}