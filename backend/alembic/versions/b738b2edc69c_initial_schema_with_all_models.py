"""initial_schema_with_all_models

Revision ID: b738b2edc69c
Revises: 
Create Date: 2026-11-05 08:15:51.959334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b738b2edc69c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. Users Table
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('hashed_password', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=128), nullable=False),
            sa.Column('business_name', sa.String(length=128), nullable=False),
            sa.Column('role', sa.String(length=32), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Audit Logs Table
    if 'audit_logs' not in existing_tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('action', sa.String(length=64), nullable=False),
            sa.Column('entity_type', sa.String(length=32), nullable=False),
            sa.Column('entity_id', sa.String(length=64), nullable=False),
            sa.Column('details_json', sa.Text(), nullable=True),
            sa.Column('performed_by', sa.String(length=64), nullable=True),
            sa.Column('timestamp', sa.DateTime(), nullable=True),
            sa.Column('previous_hash', sa.String(length=64), nullable=True),
            sa.Column('entry_hash', sa.String(length=64), nullable=True),
            sa.Column('signature', sa.String(length=64), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
        op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
        op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)

    # 3. Password Reset Tokens Table
    if 'password_reset_tokens' not in existing_tables:
        op.create_table(
            'password_reset_tokens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('token_hash', sa.String(length=128), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_password_reset_tokens_id'), 'password_reset_tokens', ['id'], unique=False)
        op.create_index(op.f('ix_password_reset_tokens_token_hash'), 'password_reset_tokens', ['token_hash'], unique=True)
        op.create_index(op.f('ix_password_reset_tokens_user_id'), 'password_reset_tokens', ['user_id'], unique=False)

    # 4. Transactions Table
    if 'transactions' not in existing_tables:
        op.create_table(
            'transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('reference_id', sa.String(length=64), nullable=False),
            sa.Column('timestamp', sa.DateTime(), nullable=True),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False),
            sa.Column('payment_status', sa.String(length=32), nullable=True),
            sa.Column('customer_id', sa.String(length=64), nullable=False),
            sa.Column('customer_name', sa.String(length=128), nullable=False),
            sa.Column('customer_email', sa.String(length=128), nullable=False),
            sa.Column('customer_baseline_amount', sa.Float(), nullable=True),
            sa.Column('customer_baseline_orders', sa.Integer(), nullable=True),
            sa.Column('account_age_days', sa.Integer(), nullable=True),
            sa.Column('failed_attempts_24h', sa.Integer(), nullable=True),
            sa.Column('ip_address', sa.String(length=64), nullable=True),
            sa.Column('ip_country', sa.String(length=64), nullable=True),
            sa.Column('billing_country', sa.String(length=64), nullable=True),
            sa.Column('shipping_country', sa.String(length=64), nullable=True),
            sa.Column('device_fingerprint', sa.String(length=64), nullable=True),
            sa.Column('items_json', sa.Text(), nullable=True),
            sa.Column('is_synthetic', sa.Boolean(), nullable=True),
            sa.Column('source', sa.String(length=32), nullable=True),
            sa.Column('provider', sa.String(length=32), nullable=True),
            sa.Column('provider_transaction_id', sa.String(length=128), nullable=True),
            sa.Column('provider_order_id', sa.String(length=128), nullable=True),
            sa.Column('payment_method', sa.String(length=32), nullable=True),
            sa.Column('risk_score', sa.Integer(), nullable=True),
            sa.Column('risk_level', sa.String(length=16), nullable=True),
            sa.Column('ml_fraud_probability', sa.Float(), nullable=True),
            sa.Column('hybrid_score', sa.Integer(), nullable=True),
            sa.Column('review_status', sa.String(length=32), nullable=True),
            sa.Column('review_notes', sa.Text(), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(), nullable=True),
            sa.Column('reviewer', sa.String(length=64), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
        op.create_index(op.f('ix_transactions_reference_id'), 'transactions', ['reference_id'], unique=True)
        op.create_index(op.f('ix_transactions_timestamp'), 'transactions', ['timestamp'], unique=False)
        op.create_index(op.f('ix_transactions_payment_status'), 'transactions', ['payment_status'], unique=False)
        op.create_index(op.f('ix_transactions_customer_id'), 'transactions', ['customer_id'], unique=False)
        op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
        op.create_index(op.f('ix_transactions_provider'), 'transactions', ['provider'], unique=False)
        op.create_index(op.f('ix_transactions_provider_order_id'), 'transactions', ['provider_order_id'], unique=False)
        op.create_index(op.f('ix_transactions_provider_transaction_id'), 'transactions', ['provider_transaction_id'], unique=False)
        op.create_index(op.f('ix_transactions_review_status'), 'transactions', ['review_status'], unique=False)

    # 5. Risk Analyses Table
    if 'risk_analyses' not in existing_tables:
        op.create_table(
            'risk_analyses',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.Integer(), nullable=False),
            sa.Column('deterministic_score', sa.Integer(), nullable=False),
            sa.Column('risk_level', sa.String(length=16), nullable=False),
            sa.Column('triggered_rules_json', sa.Text(), nullable=True),
            sa.Column('ml_fraud_probability', sa.Float(), nullable=True),
            sa.Column('ml_risk_tier', sa.String(length=16), nullable=True),
            sa.Column('hybrid_score', sa.Integer(), nullable=True),
            sa.Column('feature_attributions_json', sa.Text(), nullable=True),
            sa.Column('ai_summary', sa.Text(), nullable=True),
            sa.Column('ai_explanation', sa.Text(), nullable=True),
            sa.Column('ai_uncertainties', sa.Text(), nullable=True),
            sa.Column('ai_recommended_steps', sa.Text(), nullable=True),
            sa.Column('model_used', sa.String(length=64), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_risk_analyses_id'), 'risk_analyses', ['id'], unique=False)

    # 6. PayPal Orders Table
    if 'paypal_orders' not in existing_tables:
        op.create_table(
            'paypal_orders',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('paypal_order_id', sa.String(length=64), nullable=False),
            sa.Column('capture_id', sa.String(length=64), nullable=True),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=True),
            sa.Column('payer_email', sa.String(length=128), nullable=True),
            sa.Column('payer_name', sa.String(length=128), nullable=True),
            sa.Column('raw_response_json', sa.Text(), nullable=True),
            sa.Column('transaction_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('captured_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_paypal_orders_id'), 'paypal_orders', ['id'], unique=False)
        op.create_index(op.f('ix_paypal_orders_user_id'), 'paypal_orders', ['user_id'], unique=False)
        op.create_index(op.f('ix_paypal_orders_paypal_order_id'), 'paypal_orders', ['paypal_order_id'], unique=True)
        op.create_index(op.f('ix_paypal_orders_capture_id'), 'paypal_orders', ['capture_id'], unique=False)
        op.create_index(op.f('ix_paypal_orders_status'), 'paypal_orders', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('paypal_orders')
    op.drop_table('risk_analyses')
    op.drop_table('transactions')
    op.drop_table('password_reset_tokens')
    op.drop_table('audit_logs')
    op.drop_table('users')
