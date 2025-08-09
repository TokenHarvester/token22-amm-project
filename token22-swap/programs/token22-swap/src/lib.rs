use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::{
    associated_token::AssociatedToken,
    // Use token_interface for TokenAccount, Mint, and transfer functions
    token_interface::{TokenAccount, Mint, TokenInterface, TransferChecked, MintTo, transfer_checked, mint_to},
};
use spl_token_2022::{
    self,
    extension::{BaseStateWithExtensions, StateWithExtensions},
    state::Mint as Token2022Mint,
    extension::transfer_hook
};

declare_id!("H8j9y1sARxb73rL2RFqfpKG8Yi9CYXmgcha5n7QLYmbU");

#[program]
pub mod token22_swap {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        fee_rate: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.fee_rate = fee_rate; // e.g., 25 = 0.25%
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn add_hook_to_whitelist(
        ctx: Context<ModifyWhitelist>,
        hook_program: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(
            !config.whitelisted_hooks.contains(&hook_program),
            SwapError::HookAlreadyWhitelisted
        );
        config.whitelisted_hooks.push(hook_program);
        Ok(())
    }

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        initial_price: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        // Manual validation of mints since we use UncheckedAccount
        let mint_a_info = &ctx.accounts.mint_a;
        let mint_b_info = &ctx.accounts.mint_b;
        
        // Validate that accounts are actually mints (basic check)
        require!(mint_a_info.owner == &spl_token_2022::ID, SwapError::InvalidMint);
        require!(mint_b_info.owner == &spl_token_2022::ID, SwapError::InvalidMint);

        pool.mint_a = mint_a_info.key();
        pool.mint_b = mint_b_info.key();
        pool.reserve_a = 0;
        pool.reserve_b = 0;
        pool.total_liquidity = 0;
        pool.price = initial_price;
        pool.bump = ctx.bumps.pool;

        // Note: In a real implementation, you would create the associated token accounts
        // and liquidity mint here using CPI calls to the token program
        msg!("Pool initialized with mint_a: {}, mint_b: {}", pool.mint_a, pool.mint_b);

        Ok(())
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_a: u64,
        amount_b: u64,
        min_liquidity: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        let liquidity = if pool.total_liquidity == 0 {
            // Use a simple calculation for initial liquidity
            std::cmp::min(amount_a, amount_b)
        } else {
            std::cmp::min(
                amount_a * pool.total_liquidity / pool.reserve_a,
                amount_b * pool.total_liquidity / pool.reserve_b,
            )
        };

        require!(liquidity >= min_liquidity, SwapError::InsufficientLiquidity);

        transfer_tokens_to_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.user_token_a,
            &ctx.accounts.pool_token_a,
            &ctx.accounts.user,
            &ctx.accounts.mint_a,
            amount_a,
        )?;

        transfer_tokens_to_pool(
            &ctx.accounts.token_program,
            &ctx.accounts.user_token_b,
            &ctx.accounts.pool_token_b,
            &ctx.accounts.user,
            &ctx.accounts.mint_b,
            amount_b,
        )?;

        pool.reserve_a += amount_a;
        pool.reserve_b += amount_b;
        pool.total_liquidity += liquidity;

        let seeds = &[
            b"pool",
            pool.mint_a.as_ref(),
            pool.mint_b.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.liquidity_mint.to_account_info(),
                    to: ctx.accounts.user_liquidity_token.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer,
            ),
            liquidity,
        )?;

        Ok(())
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        minimum_amount_out: u64,
        a_to_b: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let config = &ctx.accounts.config;

        if a_to_b {
            validate_token_hooks(config, &ctx.accounts.mint_a)?;
            validate_token_hooks(config, &ctx.accounts.mint_b)?;
        } else {
            validate_token_hooks(config, &ctx.accounts.mint_b)?;
            validate_token_hooks(config, &ctx.accounts.mint_a)?;
        }

        let (reserve_in, reserve_out) = if a_to_b {
            (pool.reserve_a, pool.reserve_b)
        } else {
            (pool.reserve_b, pool.reserve_a)
        };

        let amount_in_with_fee = amount_in * (10000 - config.fee_rate) / 10000;
        let amount_out = (amount_in_with_fee * reserve_out) / (reserve_in + amount_in_with_fee);

        require!(amount_out >= minimum_amount_out, SwapError::SlippageExceeded);

        if a_to_b {
            transfer_tokens_to_pool(
                &ctx.accounts.token_program,
                &ctx.accounts.user_token_a,
                &ctx.accounts.pool_token_a,
                &ctx.accounts.user,
                &ctx.accounts.mint_a,
                amount_in,
            )?;

            transfer_tokens_from_pool(
                &ctx.accounts.token_program,
                &ctx.accounts.pool_token_b,
                &ctx.accounts.user_token_b,
                &pool.to_account_info(),
                &ctx.accounts.mint_b,
                amount_out,
                pool,
            )?;

            pool.reserve_a += amount_in;
            pool.reserve_b -= amount_out;
        } else {
            transfer_tokens_to_pool(
                &ctx.accounts.token_program,
                &ctx.accounts.user_token_b,
                &ctx.accounts.pool_token_b,
                &ctx.accounts.user,
                &ctx.accounts.mint_b,
                amount_in,
            )?;

            transfer_tokens_from_pool(
                &ctx.accounts.token_program,
                &ctx.accounts.pool_token_a,
                &ctx.accounts.user_token_a,
                &pool.to_account_info(),
                &ctx.accounts.mint_a,
                amount_out,
                pool,
            )?;

            pool.reserve_b += amount_in;
            pool.reserve_a -= amount_out;
        }

        Ok(())
    }
}

fn validate_token_hooks(config: &Config, mint: &InterfaceAccount<Mint>) -> Result<()> {
    let mint_info = mint.to_account_info();
    let mint_data = mint_info.try_borrow_data()?;
    
    if mint_data.len() > Token2022Mint::LEN {
        let mint_state = StateWithExtensions::<Token2022Mint>::unpack(&mint_data)?;
        
        if let Ok(extension) = mint_state.get_extension::<transfer_hook::TransferHook>() {
            // Handle OptionalNonZeroPubkey properly
            if let Some(hook_program) = Option::<Pubkey>::from(extension.program_id) {
                require!(
                    config.whitelisted_hooks.contains(&hook_program),
                    SwapError::UnauthorizedHook
                );
            }
        }
    }
    
    Ok(())
}

fn transfer_tokens_to_pool<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    authority: &Signer<'info>,
    mint: &InterfaceAccount<'info, Mint>,
    amount: u64,
) -> Result<()> {
    transfer_checked(
        CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                from: from.to_account_info(),
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: authority.to_account_info(),
            },
        ),
        amount,
        mint.decimals,
    )
}

fn transfer_tokens_from_pool<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    authority: &AccountInfo<'info>,
    mint: &InterfaceAccount<'info, Mint>,
    amount: u64,
    pool: &Pool,
) -> Result<()> {
    let seeds = &[
        b"pool",
        pool.mint_a.as_ref(),
        pool.mint_b.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    transfer_checked(
        CpiContext::new_with_signer(
            token_program.to_account_info(),
            TransferChecked {
                from: from.to_account_info(),
                mint: mint.to_account_info(),
                to: to.to_account_info(),
                authority: authority.clone(),
            },
            signer,
        ),
        amount,
        mint.decimals,
    )
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ModifyWhitelist<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = admin
    )]
    pub config: Account<'info, Config>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    /// CHECK: Mint A account - validated in instruction
    pub mint_a: UncheckedAccount<'info>,
    /// CHECK: Mint B account - validated in instruction
    pub mint_b: UncheckedAccount<'info>,
    /// CHECK: Pool token A account - will be created
    #[account(mut)]
    pub pool_token_a: UncheckedAccount<'info>,
    /// CHECK: Pool token B account - will be created
    #[account(mut)]
    pub pool_token_b: UncheckedAccount<'info>,
    /// CHECK: Liquidity mint - will be created
    #[account(mut)]
    pub liquidity_mint: UncheckedAccount<'info>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: Token program
    pub token_program: UncheckedAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.mint_a.as_ref(), pool.mint_b.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub pool_token_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub liquidity_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_token_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_liquidity_token: InterfaceAccount<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.mint_a.as_ref(), pool.mint_b.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mint::token_program = token_program)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub pool_token_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,
    pub user: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub fee_rate: u64,
    #[max_len(50)]
    pub whitelisted_hooks: Vec<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub reserve_a: u64,
    pub reserve_b: u64,
    pub total_liquidity: u64,
    pub price: u64,
    pub bump: u8,
}

#[error_code]
pub enum SwapError {
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Unauthorized transfer hook")]
    UnauthorizedHook,
    #[msg("Hook already whitelisted")]
    HookAlreadyWhitelisted,
    #[msg("Invalid mint account")]
    InvalidMint,
}